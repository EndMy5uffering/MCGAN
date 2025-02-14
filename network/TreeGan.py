import torch
import torch.nn as nn

class Generator(nn.Module):
    def __init__(self):
        super(Generator, self).__init__()

        def block(in_feat, out_feat, normalize=True):
            layers = [nn.Linear(in_feat, out_feat)]
            if normalize:
                layers.append(nn.BatchNorm1d(out_feat, 0.8))
            layers.append(nn.LeakyReLU(0.2, inplace=True))
            return layers

        self.pre = nn.Sequential(
            nn.Linear(3, 128, bias=True),
            nn.LeakyReLU(0.2, inplace=True),
            nn.Linear(128, 640, bias=True),
            nn.LeakyReLU(0.2, inplace=True),
            nn.Linear(640, 1280, bias=True),
            nn.LeakyReLU(0.2, inplace=True),
            nn.Linear(1280, 2560, bias=True),
        )

        self.convolution = nn.Sequential(
            nn.ConvTranspose3d(10, 10*2, kernel_size=12, stride=3, padding=8),
            nn.ReLU(),
            nn.ConvTranspose3d(20, 20, kernel_size=10, stride=2, padding=1),
            nn.BatchNorm3d(20),
            nn.ReLU(),
            nn.ConvTranspose3d(20, 10, kernel_size=8, stride=2, padding=2),
            nn.BatchNorm3d(10),
            nn.ReLU(),
            nn.ConvTranspose3d(10, 10, kernel_size=6, stride=1, padding=2),
            nn.ReLU(),
            nn.ConvTranspose3d(10, 5, kernel_size=4, stride=1, padding=1),
            nn.BatchNorm3d(5),
            nn.ReLU(),
            nn.ConvTranspose3d(5, 1, kernel_size=3, stride=1, padding=2),
            nn.ReLU(),
            nn.ConvTranspose3d(1, 1, kernel_size=4, stride=1, padding=0),
            nn.Sigmoid()
        )


    def forward(self, lable, noise):
        n = self.pre(lable)
        x = torch.cat((n, noise), 1)
        return self.convolution(x.view(x.shape[0], 10, 8, 8, 8)).reshape((x.shape[0], 85, 85, 85))
    
class Discriminator(nn.Module):
    def __init__(self):
        super(Discriminator, self).__init__()

        self.pre = nn.Sequential(
            nn.Linear(3, 32, bias=True),
            nn.LeakyReLU(0.02, inplace=True),
            nn.Linear(32, 64, bias=True),
            nn.LeakyReLU(0.02, inplace=True),
            nn.Linear(64, 64, bias=True),
        )

        self.linear = nn.Sequential(
            nn.Flatten(),
            nn.Linear(704, 1024), 
            nn.LeakyReLU(0.02, inplace=True),
            nn.Linear(1024, 912), 
            nn.LeakyReLU(0.02, inplace=True),
            nn.Linear(912, 764), 
            nn.LeakyReLU(0.02, inplace=True),
            nn.Linear(764, 664),
            nn.LeakyReLU(0.02, inplace=True),
            nn.Linear(664, 512),
            nn.LeakyReLU(0.02, inplace=True),
            nn.Linear(512, 424),
            nn.LeakyReLU(0.02, inplace=True),
            nn.Linear(424, 312),
            nn.LeakyReLU(0.02, inplace=True),
            nn.Linear(312, 225),
            nn.LeakyReLU(0.02, inplace=True),
            nn.Linear(225, 124),
            nn.LeakyReLU(0.02, inplace=True),
            nn.Linear(124, 94),
            nn.LeakyReLU(0.02, inplace=True),
            nn.Linear(94, 45),
            nn.LeakyReLU(0.02, inplace=True),
            nn.Linear(45, 25),
            nn.LeakyReLU(0.02, inplace=True),
            nn.Linear(25, 12),
            nn.LeakyReLU(0.02, inplace=True),
            nn.Linear(12, 6),
            nn.LeakyReLU(0.02, inplace=True),
            nn.Linear(6, 1),
            nn.Sigmoid() 
        )

        self.convolution = nn.Sequential(
            nn.Conv3d(1, 10, (2, 2, 2), stride=(1, 1, 1), padding=(0, 0, 0)),
            nn.BatchNorm3d(10),
            nn.LeakyReLU(0.02, True),
            nn.Conv3d(10, 10*2, (2, 2, 2), stride=(2, 2, 2), padding=(0, 0, 0)),
            nn.BatchNorm3d(10*2),
            nn.LeakyReLU(0.02, True),
            nn.Conv3d(10*2, 10*4, (3, 3, 3), stride=(2, 2, 2), padding=(0, 0, 0)),
            nn.BatchNorm3d(10*4),
            nn.LeakyReLU(0.02, True),
            nn.Conv3d(10*4, 10*2, (2, 2, 2), stride=(2, 2, 2), padding=(0, 0, 0)),
            nn.BatchNorm3d(10*2),
            nn.LeakyReLU(0.02, True),
            nn.Conv3d(10*2, 10, (3, 3, 3), stride=(2, 2, 2), padding=(0, 0, 0)),
            nn.Sigmoid()
        )

    def forward(self, data, labels):
        k = self.convolution(data.reshape(data.shape[0], 1, 85, 85, 85)).view(data.shape[0], -1) # 640
        n = self.pre(labels.float()) # 64
        x = torch.cat((n, k), 1) # 704
        return self.linear(x)