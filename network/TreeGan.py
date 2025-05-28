import torch
import torch.nn as nn

class EfficientUpsampler(nn.Module):
    def __init__(self, in_size = 256, normalized_data = False):
        super(EfficientUpsampler, self).__init__()
        self.linear = nn.Linear(in_size, 16 * 8 * 8 * 8)  
        self.net = nn.Sequential(
            nn.ConvTranspose3d(16, 16, kernel_size=4, stride=3, padding=1),  
            nn.LeakyReLU(negative_slope=0.02) if not normalized_data else nn.Tanh(),
            nn.ConvTranspose3d(16, 16, kernel_size=4, stride=2, padding=1), 
            nn.LeakyReLU(negative_slope=0.02) if not normalized_data else nn.Tanh(),
            nn.ConvTranspose3d(16, 8, kernel_size=4, stride=2, padding=1),
            nn.LeakyReLU(negative_slope=0.02) if not normalized_data else nn.Tanh(),
            nn.ConvTranspose3d(8, 8, kernel_size=3, stride=1, padding=1), 
            nn.LeakyReLU(negative_slope=0.02) if not normalized_data else nn.Tanh(),
            nn.ConvTranspose3d(8, 1, kernel_size=2, stride=1, padding=1), 
            nn.LeakyReLU(negative_slope=0.02) if not normalized_data else nn.Tanh(),
            nn.ConvTranspose3d(1, 1, kernel_size=1, stride=1, padding=1), 
            nn.LeakyReLU(negative_slope=0.02) if not normalized_data else nn.Tanh(),
            nn.ConvTranspose3d(1, 1, kernel_size=1, stride=1, padding=1), 
            nn.LeakyReLU(negative_slope=0.02) if not normalized_data else nn.Tanh(),
            nn.ConvTranspose3d(1, 1, kernel_size=1, stride=1, padding=1), 
            nn.ReLU() if not normalized_data else nn.Sigmoid(),
        )

    def forward(self, lable, noise):
        x = self.linear(torch.cat((lable, noise), 1))
        x = x.view(-1, 16, 8, 8, 8)
        x = self.net(x)
        x = x.view(x.size(0), -1)
        return (x[:, :614125]).reshape(x.shape[0],85,85,85)


class Discriminator(nn.Module):
    def __init__(self, normalized_data = False):
        super(Discriminator, self).__init__()

        self.pre = nn.Sequential(
            nn.Linear(3, 32, bias=False),
            nn.LeakyReLU(0.02, inplace=True),
            nn.Linear(32, 64, bias=False),
        )

        self.linear = nn.Sequential(
            nn.Flatten(),
            nn.Linear(704, 512), 
            nn.LeakyReLU(0.02, inplace=True),
            nn.Linear(512, 256), 
            nn.LeakyReLU(0.02, inplace=True),
            nn.Linear(256, 1),
            nn.Sigmoid() 
        )

        self.convolution = nn.Sequential(
            nn.Conv3d(1, 10, (2, 2, 2), stride=(1, 1, 1), padding=(0, 0, 0)),
            nn.BatchNorm3d(10),
            nn.LeakyReLU(0.02, True)  if not normalized_data else nn.Tanh(),
            nn.Conv3d(10, 10*2, (2, 2, 2), stride=(2, 2, 2), padding=(0, 0, 0)),
            nn.BatchNorm3d(10*2),
            nn.LeakyReLU(0.02, True) if not normalized_data else nn.Tanh(),
            nn.Conv3d(10*2, 10*4, (3, 3, 3), stride=(2, 2, 2), padding=(0, 0, 0)),
            nn.BatchNorm3d(10*4),
            nn.LeakyReLU(0.02, True) if not normalized_data else nn.Tanh(),
            nn.Conv3d(10*4, 10*2, (2, 2, 2), stride=(2, 2, 2), padding=(0, 0, 0)),
            nn.BatchNorm3d(10*2),
            nn.LeakyReLU(0.02, True) if not normalized_data else nn.Tanh(),
            nn.Conv3d(10*2, 10, (3, 3, 3), stride=(2, 2, 2), padding=(0, 0, 0)),
            nn.Sigmoid()
        )

    def forward(self, data, labels):
        k = self.convolution(data.reshape(data.shape[0], 1, 85, 85, 85)).view(data.shape[0], -1) # 640
        n = self.pre(labels.float()) # 64
        x = torch.cat((n, k), 1) # 704
        return self.linear(x)