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
import numpy as np
from tqdm import tqdm
import gzip
import snakenbt
from NBTSchematic import Schematic
from pathlib import Path
from collections import defaultdict
import uuid
import json
from datetime import datetime
from Randomizer import Randomizer

hparams = {
    "gamma": 0.95,
    "lr_g": 1e-8,
    "lr_d": 1e-8,
    "grad_clipping": False,
    "use_scheduler_g": True,
    "scheduler_rate_g": 0.01,
    "use_scheduler_d": True,
    "scheduler_rate_d": 0.01,
    "betas_g": (0.8, 0.9999),
    "betas_d": (0.8, 0.9999),
    "epochs": 16,
    "batch_size": 16,
    "random_vector_len": 24,
    "normalize_dataset": True
}

settings = {
    "grad_history": True,
    "auto_save": True,
    "randomize": True,
    "randomize_runs": 20
}

randomize_settings = {
    "gamma": (0.7, 0.999),
    "lr_g": (1e-3, 1e-8),
    "lr_d": (1e-3, 1e-8),
    "random_vector_len": [3,6,9,12,16,32,64],
    "grad_clipping": [True, False],
    "scheduler_rate_g": (0.05, 0.3),
    "scheduler_rate_d": (0.05, 0.3),
    "epochs": [4,8,16,32,64],
    "batch_size": [4,8,16,32,64],
}

meta_info = {}

PRINT_DICT = lambda name, d : print(f"{name}:\n{"\n".join([str(k) + ": " + str(v) for k, v in d.items()])}\n{"-"*10}")

def train_gan(generator : nn.Module, discriminator : nn.Module, num_epochs, dataloader : torch.utils.data.DataLoader, device : torch.device, real_label = 1., fake_label = 0.):
    G_losses = []
    D_losses = []

    gen_grad_history = defaultdict(list)
    disc_grad_history = defaultdict(list)

    generator.train()
    discriminator.train()

    loss = nn.BCELoss()

    # Setup Adam optimizers for both G and D
    optimizerD = optim.Adam(discriminator.parameters(), lr=hparams.get("lr_d", 0.0002), betas=hparams.get("betas_d", (0.8, 0.9999)))
    optimizerG = optim.Adam(generator.parameters(), lr=hparams.get("lr_g", 0.0002), betas=hparams.get("betas_g", (0.8, 0.9999)))

    meta_info["scheduler_step_size_D"] = int(num_epochs * len(dataloader) * hparams.get("scheduler_rate_d", 0.1))
    meta_info["scheduler_step_size_G"] = int(num_epochs * len(dataloader) * hparams.get("scheduler_rate_g", 0.1))
    schedulerD = torch.optim.lr_scheduler.StepLR(optimizerD, step_size=meta_info["scheduler_step_size_D"], gamma=hparams.get('gamma', 0.8))
    schedulerG = torch.optim.lr_scheduler.StepLR(optimizerG, step_size=meta_info["scheduler_step_size_G"], gamma=hparams.get('gamma', 0.8))


    print("Starting Training Loop...")
    # For each epoch
    for epoch in tqdm(range(num_epochs), desc="Epochs:"):
        # For each batch in the dataloader
        #(imgs, l)
        tqdm.write(f"LR_G: {optimizerG.param_groups[0]["lr"]} | LR_D: {optimizerD.param_groups[0]["lr"]}")
        inner = tqdm(enumerate(dataloader, 0), total=len(dataloader), desc="Batches", leave=False)
        for i, data in inner:
            
            b_size = data["data"].shape[0]
            b_data = data["data"].float().to(device)
            b_labels = data["dim"].float().to(device)

            valid = torch.full((b_size, 1), real_label, dtype=torch.float, device=device, requires_grad=False)
            fake = torch.full((b_size, 1), fake_label, dtype=torch.float, device=device, requires_grad=False)

            #  Train Generator
            optimizerG.zero_grad()
            noise = torch.randn(b_labels.size(0), int(hparams.get('random_vector_len', 3))).float().to(device)
            gen_imgs = generator(b_labels, noise)
            g_loss = loss(discriminator(gen_imgs, b_labels), valid) 
            g_loss.backward()

            if hparams.get("grad_clipping", False):
                torch.nn.utils.clip_grad_norm_(generator.parameters(), max_norm=1.0)

            if settings.get("grad_history", False):
                for name, param in generator.named_parameters():
                    if param.grad is not None:
                        grad_mean = param.grad.mean().item()
                        gen_grad_history[name].append(grad_mean)

            optimizerG.step()

            if hparams.get("use_scheduler_g", True):
                schedulerG.step()
                
            #  Train Discriminator
            optimizerD.zero_grad()
            real_loss = loss(discriminator(b_data, b_labels), valid)
            fake_loss = loss(discriminator(gen_imgs.detach(), b_labels), fake)
            d_loss = (real_loss + fake_loss) / 2.0
            d_loss.backward()

            if hparams.get("grad_history", False):
                for name, param in discriminator.named_parameters():
                    if param.grad is not None:
                        grad_mean = param.grad.mean().item()
                        disc_grad_history[name].append(grad_mean)

            optimizerD.step()
            
            if hparams.get("use_scheduler_d", True):
                schedulerD.step()

            inner.set_postfix(DLoss=d_loss.item(), GLoss=g_loss.item())
                
            # Save Losses for plotting later
            G_losses.append(g_loss.item())
            D_losses.append(d_loss.item())

            #if g_loss > 2 or d_loss > 2:
            #    return G_losses, D_losses, gen_grad_history, disc_grad_history
            
    return G_losses, D_losses, gen_grad_history, disc_grad_history

def weights_init(m):
    classname = m.__class__.__name__
    if classname.find('Conv') != -1:
        nn.init.kaiming_normal_(m.weight.data)
        torch.nn.init.kaiming_uniform_(m.weight.data, a=0.2, mode='fan_in', nonlinearity='leaky_relu')
    elif classname.find('BatchNorm') != -1:
        nn.init.normal_(m.weight.data, 1.0, 0.02)
        nn.init.constant_(m.bias.data, 0)

def save_schem_from_raw(data: torch.tensor, renormfunc, dims: torch.tensor, pallet, savePathSubFolder: Path = Path("./"), FileName: str = "sample"):
    w, h, l = dims.tolist()
    
    data = renormfunc(data)
    data = np.rint(np.clip(data, 0, len(pallet)-1))
    output_data = np.array(data.tolist()).reshape(85,85,85)[:h,:l,:w]
    schem = Schematic(w, h, l, pallet)
    schem.data = schem.convert_np_data_to_bytes(output_data.astype(int))

    if not (Path('./Network_Output/')/savePathSubFolder).exists():
        (Path('./Network_Output/')/savePathSubFolder).mkdir()

    with gzip.open(Path('./Network_Output/')/savePathSubFolder/f"{FileName}.schem", "wb") as f:
        f.write(snakenbt.dumps(schem.format_as_schem()))

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


def debug_loader():
    print("Preping data")
    dataloader, pallet, renorm = SchemDataLoader.quickLoad_overfit(batchsize=1 ,datapath="./network/datasets/compact_set_02.pt", sample=0, samplesize=1000)
    raw_data = next(iter(dataloader))
    save_schem_from_raw(data=raw_data["data"][0], renormfunc=renorm, dims=raw_data["dim"][0], pallet=pallet, savePathSubFolder="debug")
    print("Data preped")

def fixedOverfitt():

    BATCHSIZE = 1

    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")

    print(f"Running on {device}")
    netG = TreeGan.EfficientUpsampler(3+int(hparams.get("random_vector_len", 3)), hparams.get("normalize_dataset", False)).to(device)
    netG.apply(weights_init)

    print("Preping data")
    dataloader, pallet, renorm = SchemDataLoader.quickLoad_overfit(batchsize=BATCHSIZE, normalized=hparams.get("normalize_dataset", False) ,datapath="./network/datasets/compact_set_02.pt", sample=0, samplesize=1000)
    raw_data = next(iter(dataloader))
    save_schem_from_raw(data=raw_data["data"][0], renormfunc=renorm, dims=raw_data["dim"][0], pallet=pallet, savePathSubFolder="over", FileName="Original")
    print("Data preped")

    criterion = nn.MSELoss()  # or L1Loss
    optimizer = torch.optim.Adam(netG.parameters(), lr=1e-4)
    schedulerG = torch.optim.lr_scheduler.StepLR(optimizer, step_size=800, gamma=0.8)


    fixed_noise = torch.randn(BATCHSIZE, int(hparams.get("random_vector_len", 3))).to(device)
    sample_lable = 0
    for epoch in tqdm(range(hparams.get("epochs", 16)), desc="Epochs:"):
        inner = tqdm(enumerate(dataloader, 0), total=len(dataloader), desc="Batches", leave=False)
        for i, data in inner:

            b_data = data["data"].float().to(device)
            b_labels = data["dim"].float().to(device)
            sample_lable = b_labels
            optimizer.zero_grad()
            output = netG(b_labels, fixed_noise)
            loss = criterion(output.view(output.shape[0], -1), b_data)
            loss.backward()
            optimizer.step()
            schedulerG.step()
            inner.set_postfix(GLoss=loss.item(), Otim=optimizer.param_groups[0]["lr"])



    netG.eval()
    output = netG(sample_lable, fixed_noise)

    arr = output.cpu().detach().numpy()
    save_schem_from_raw(data=arr, renormfunc=renorm, dims=raw_data["dim"][0], pallet=pallet, savePathSubFolder="over", FileName="Generated")
    #save_demo_output(netG, Path("./Network_Output/Overfit"), pallet)
    pass

def gradient_plot(gen_grad_history, disc_grad_history):
    plt.figure(figsize=(12, 6))

    # Plot Generator gradients
    for name, grad_values in gen_grad_history.items():
        plt.plot(grad_values, label=f'Gen: {name}', linestyle='-')

    # Plot Discriminator gradients
    for name, grad_values in disc_grad_history.items():
        plt.plot(grad_values, label=f'Disc: {name}', linestyle='--')

    plt.title("Gradient Means Over Time (Generator & Discriminator)")
    plt.xlabel("Batch")
    plt.ylabel("Gradient Mean")
    plt.legend()
    plt.grid(True)
    plt.tight_layout()
    plt.show()

def gradient_plot_2(gen_grad_history, disc_grad_history, train_id):
    # Plot Generator Gradients
    plt.figure(figsize=(32, 9))
    for name, grad_values in gen_grad_history.items():
        plt.plot(grad_values, label=f'Gen {name}')
    plt.title("Generator Gradient Means Over Time")
    plt.xlabel("Batch")
    plt.ylabel("Gradient Mean")
    plt.legend()
    plt.grid(True)
    #plt.show()
    plt.savefig(f"./Network_Output/{train_id}/Generator_Gradients.png", dpi=600)

    # Plot Discriminator Gradients
    for name, grad_values in disc_grad_history.items():
        plt.plot(grad_values, label=f'Disc {name}')
    plt.title("Discriminator Gradient Means Over Time")
    plt.xlabel("Batch")
    plt.ylabel("Gradient Mean")
    plt.legend()
    plt.grid(True)
    #plt.show()
    plt.savefig(f"./Network_Output/{train_id}/Discriminator_Gradients.png", dpi=600)


def save_demo_output(model, renormfunc, OUTPUT_PATH: Path, pallet, samples = 10):
    if not OUTPUT_PATH.exists():
        OUTPUT_PATH.mkdir(parents=True)

    model.eval()
    model.to("cpu")
    
    minW, maxW = 20, 85
    minH, maxH = 20, 85
    minL, maxL = 20, 85

    lable = torch.tensor([[random.randint(minW, maxW), random.randint(minH, maxH), random.randint(minL, maxL)] for _ in range(samples)]).float()
    noise = torch.randn(samples, int(hparams.get("random_vector_len", 3))).float()

    sample = model(lable, noise)

    arr = sample.cpu().detach().numpy()
    lable = np.rint(lable.cpu().detach().numpy())

    arr = np.rint(np.clip(renormfunc(arr), 0, len(pallet)-1))
    #arr *= 26683
    #arr[arr<0] = 0

    for i, e in enumerate(zip(arr, lable)):
        s, k = e
        w, h, l = k
        s = np.rint(s)
        #n_data, palette_o = clean_palette(s, pallet)
        output_data = s.reshape(85,85,85)[:int(h),:int(l),:int(w)]
        schem = Schematic(int(w), int(h), int(l), pallet)
        schem.data = schem.convert_np_data_to_bytes(output_data.astype(int))
        
        with gzip.open(OUTPUT_PATH/f"GEN_{w}_{h}_{l}-{i}.schem", "wb") as f:
            f.write(snakenbt.dumps(schem.format_as_schem()))


def trainGAN():

    PRINT_DICT("hparmas", hparams)
    PRINT_DICT("settings", settings)
    PRINT_DICT("randomize_settings", randomize_settings)

    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
    print(f"Running on {device}")
    print("Preping data")
    data, pallet, renorm = SchemDataLoader.quickLoad(batchsize=hparams.get("batch_size", 8), normalized=hparams.get("normalize_dataset", False), datapath="./network/datasets/compact_set_02.pt")
    meta_info["training_set"] = "./network/datasets/compact_set_02.pt"
    print("Data preped")

    for rand_run in range(settings.get("randomize_runs", 1) if settings.get("randomize", False) else 1):
        meta_info["start_time"] = datetime.now().strftime("%H:%M:%S %d-%m-%Y")
        if settings.get("randomize", False):
            Randomizer.randomize(hparams, randomize_settings)
            meta_info["randomized_run"] = rand_run
            print(f"Randomized run: {rand_run+1}/{settings.get("randomize_runs", 1)}")

        
        training_id = uuid.uuid4()

        print(f"Training id {training_id}")

        PRINT_DICT("hparmas", hparams)

        netG = TreeGan.EfficientUpsampler(3 + int(hparams.get("random_vector_len", 3)), hparams.get("normalize_dataset", False)).to(device)
        netG.apply(weights_init)

        netD = TreeGan.Discriminator(normalized_data=hparams.get("normalize_dataset", False)).to(device)
        netD.apply(weights_init)

        start_time = datetime.now()
        G_losses, D_losses, gen_grad_history, disc_grad_history = train_gan(netG, netD, hparams.get("epochs", 8), data, device)
        
        meta_info["end_time"] = datetime.now().strftime("%H:%M:%S %d-%m-%Y")
        meta_info["duration"] = str(datetime.now() - start_time)

        if not Path(f"./Network_Output/{training_id}").exists():
            Path(f"./Network_Output/{training_id}").mkdir(parents=True)

        if settings.get("grad_history", False):
            gradient_plot_2(gen_grad_history, disc_grad_history, training_id)

        plt.figure(figsize=(10,5))
        plt.title("Generator and Discriminator Loss During Training")
        plt.plot(G_losses,label="G")
        plt.plot(D_losses,label="D")
        plt.xlabel("iterations")
        plt.ylabel("Loss")
        plt.legend()
        #plt.show()
        plt.savefig(f"./Network_Output/{training_id}/TrainLoss.png")

        netD.eval()
        netG.eval()

        with open(f"./Network_Output/{training_id}/hparams.json", "w+") as file:
            json.dump(hparams, file, indent=4)

        with open(f"./Network_Output/{training_id}/settings.json", "w+") as file:
            json.dump(settings, file, indent=4)    
        
        with open(f"./Network_Output/{training_id}/meta_info.json", "w+") as file:
            json.dump(meta_info, file, indent=4)
        
        if settings.get("randomize", False):
            with open(f"./Network_Output/{training_id}/randomize_settings.json", "w+") as file:
                json.dump(randomize_settings, file, indent=4)

        def save_net(pallet, renormfunc):
            torch.save(netG.state_dict(), f"./Network_Output/{training_id}/model_scripted_G.pt")
            torch.save(netD.state_dict(), f"./Network_Output/{training_id}/model_scripted_D.pt")

            save_demo_output(netG, renormfunc, Path(f"./Network_Output/{training_id}"), pallet, 10)

        if settings.get("auto_save", False):
            save_net(pallet, renorm)
        else:
            while(True):
                x = input("> Save net? [Y/N]: ").upper()
                if x == "Y":
                    save_net(pallet, renorm)
                    break
                elif x == "N":
                    print("Model was not saved!")
                    break    
        pass



if __name__ == "__main__":
    #trainGAN()
    fixedOverfitt()
    #debug_loader()