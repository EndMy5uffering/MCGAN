import torch
from torch import nn
from torch import optim
import torch.utils
import TreeGan
import random
import SchemDataLoader
import matplotlib.pyplot as plt
import torchvision.transforms as transforms
from torchvision.utils import save_image
import torchvision.utils as vutils
from torchvision import datasets
import os
import numpy as np
from tqdm import tqdm

hparams = {
    "gamma": 0.8,
    "lr": 0.0002,
}

def train_gan(generator : nn.Module, discriminator : nn.Module, num_epochs, dataloader : torch.utils.data.DataLoader, device : torch.device, real_label = 1., fake_label = 0.):
    G_losses = []
    D_losses = []

    generator.train()
    discriminator.train()

    loss = nn.BCELoss()

    # Setup Adam optimizers for both G and D
    optimizerD = optim.Adam(discriminator.parameters(), lr=hparams.get("lr", 0.0002), betas=(0.5,0.999))
    optimizerG = optim.Adam(generator.parameters(), lr=hparams.get("lr", 0.0002), betas=(0.5,0.999))

    schedulerD = torch.optim.lr_scheduler.StepLR(optimizerD, step_size=int(num_epochs * len(dataloader) / 5), gamma=hparams.get('gamma', 0.8))
    schedulerG = torch.optim.lr_scheduler.StepLR(optimizerG, step_size=int(num_epochs * len(dataloader) / 5), gamma=hparams.get('gamma', 0.8))

    print("Starting Training Loop...")
    # For each epoch
    for epoch in tqdm(range(num_epochs), desc="Epochs:"):
        # For each batch in the dataloader
        #(imgs, l)
        inner = tqdm(enumerate(dataloader, 0), total=len(dataloader), desc="Batches", leave=False)
        for i, data in inner:
            
            b_size = data["data"].shape[0]
            b_data = data["data"].float().to(device)
            b_labels = data["dim"].float().to(device)

            valid = torch.full((b_size, 1), real_label, dtype=torch.float, device=device, requires_grad=False)
            fake = torch.full((b_size, 1), fake_label, dtype=torch.float, device=device, requires_grad=False)

            #  Train Generator
            optimizerG.zero_grad()
            noise = torch.randn(b_labels.size(0), 2560).float().to(device)
            gen_imgs = generator(b_labels, noise)
            g_loss = loss(discriminator(gen_imgs, b_labels), valid) 
            g_loss.backward()
            optimizerG.step()
            schedulerG.step()
                
            #  Train Discriminator
            optimizerD.zero_grad()
            real_loss = loss(discriminator(b_data, b_labels), valid)
            fake_loss = loss(discriminator(gen_imgs.detach(), b_labels), fake)
            d_loss = (real_loss + fake_loss) / 2.0
            d_loss.backward()
            optimizerD.step()
            schedulerD.step()

            inner.set_postfix(DLoss=d_loss.item(), GLoss=g_loss.item())
                
            # Save Losses for plotting later
            G_losses.append(g_loss.item())
            D_losses.append(d_loss.item())
            
    return G_losses, D_losses

def weights_init(m):
    classname = m.__class__.__name__
    if classname.find('Conv') != -1:
        print("Init conv with kaiming")
        nn.init.kaiming_normal_(m.weight.data)
    elif classname.find('BatchNorm') != -1:
        print("Init Batch Norm with normal init")
        nn.init.normal_(m.weight.data, 1.0, 0.02)
        nn.init.constant_(m.bias.data, 0)



def clean_palette(data: np.array, palette):
    blocks = set(data.flatten())
    palette_o = {k:v for k,v in palette.items() if v in blocks}
    palette_r = {v:k for k,v in palette.items()}

    count = 0
    for e in palette_o.keys():
        palette_o[e] = count
        count += 1 

    n_data = np.array([palette_o[palette_r[e]] for e in data.flatten()])
    return n_data, palette_o

if __name__ == "__main__":
    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")

    print(f"Running on {device}")

    netG = TreeGan.Generator().to(device)
    netG.apply(weights_init)

    netD = TreeGan.Discriminator().to(device)
    netD.apply(weights_init)
    print("Preping data")
    data = SchemDataLoader.load_train(datapath="./network/datasets/data_set_tree_03.csv")
    print("Data preped")

    G_losses, D_losses = train_gan(netG, netD, 8, data, device)

    plt.figure(figsize=(10,5))
    plt.title("Generator and Discriminator Loss During Training")
    plt.plot(G_losses,label="G")
    plt.plot(D_losses,label="D")
    plt.xlabel("iterations")
    plt.ylabel("Loss")
    plt.legend()
    plt.show()

    netD.eval()
    netG.eval()

    while(True):
        x = input("> Save net? [Y/N]: ").upper()
        if x == "Y":
            torch.save(netG.state_dict(), "./model_scripted_G.pt")
            torch.save(netD.state_dict(), "./model_scripted_D.pt")
            break
        elif x == "N":
            print("Model was not saved!")
            break    