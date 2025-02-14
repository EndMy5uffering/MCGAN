import torch
from torch import nn
from torch import optim
import torch.utils
import TreeGan
import random
import matplotlib.pyplot as plt
import torchvision.transforms as transforms
from torchvision.utils import save_image
import torchvision.utils as vutils
from torchvision import datasets
import os
import numpy as np
from NBTSchematic import Schematic
import snakenbt
import gzip
from pathlib import Path
from PIL import Image

OUTPUT_PATH = Path('./Network_Output/')
PALETTE_PATH = './BlockPallet.txt'

with open(PALETTE_PATH, 'r') as f:
    NORM_PALETTE = {v.strip():i for i,v in enumerate(f.readlines())}

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


# Visualization function for activations
def plot_activations(layer, name, folder="./data_plots"):
    print(layer.shape)
    num_kernels = layer.shape[1]
    depth = layer.shape[2]
    for i in range(depth*num_kernels):
        imdata = layer[0, i//depth, i%depth].cpu().numpy()
        im = Image.fromarray(imdata)
        im.save(folder+f"/{name}_{i//depth}_{i%depth}.png")


activations = {}
def get_activation(name):
    def hook(model, input, output):
        activations[name] = output.detach()
    return hook

def debug_network():

    model = TreeGan.Generator()
    model.load_state_dict(torch.load("./model_scripted_G.pt"))
    model.eval()

    model.convolution[2].register_forward_hook(get_activation('activ0'))
    model.convolution[5].register_forward_hook(get_activation('activ1'))
    model.convolution[8].register_forward_hook(get_activation('activ2'))
    model.convolution[11].register_forward_hook(get_activation('activ3'))
    model.convolution[14].register_forward_hook(get_activation('activ4'))
    model.convolution[16].register_forward_hook(get_activation('activ5'))

    samples = 10
    minW, maxW = 20, 85
    minH, maxH = 20, 85
    minL, maxL = 20, 85

    lable = torch.tensor([[random.randint(minW, maxW), random.randint(minH, maxH), random.randint(minL, maxL)] for _ in range(samples)]).float()
    noise = torch.randn(samples, 20).float()

    with torch.no_grad():
        sample = model(lable, noise)
    

    plot_activations(activations['activ0'], "layer_0")
    #plot_activations(activations['activ1'])
    #plot_activations(activations['activ2'])
    #plot_activations(activations['activ3'])
    #plot_activations(activations['activ4'])
    #plot_activations(activations['activ5'])


def generate_debug_output():
    if not OUTPUT_PATH.exists():
        OUTPUT_PATH.mkdir()

    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
    print(f"Running on {device}")

    model = TreeGan.Generator()
    model.load_state_dict(torch.load("./model_scripted_G.pt"))
    model.eval()

    samples = 10
    minW, maxW = 20, 85
    minH, maxH = 20, 85
    minL, maxL = 20, 85

    lable = torch.tensor([[random.randint(minW, maxW), random.randint(minH, maxH), random.randint(minL, maxL)] for _ in range(samples)]).float()
    noise = torch.randn(samples, 2560).float()

    sample = model(lable, noise)

    arr = sample.cpu().detach().numpy()
    lable = np.rint(lable.cpu().detach().numpy())

    MAX_PALETTE_VALUE = max(NORM_PALETTE.values())

    #((float(n)/26683)-0.5)/0.5
    #arr *= 0.5
    #arr += 0.5
    arr *= MAX_PALETTE_VALUE
    arr[arr<0] = 0

    for i, e in enumerate(zip(arr, lable)):
        s, k = e
        w, h, l = k
        s = np.rint(s)
        n_data, palette_o = clean_palette(s, NORM_PALETTE)

        output_data = n_data.reshape(85,85,85)[:int(w),:int(h),:int(l)]
        schem = Schematic(int(w), int(h), int(l), palette_o)
        schem.data = schem.convert_np_data_to_bytes(output_data.astype(int))
        
        with gzip.open(OUTPUT_PATH/f"GEN_{w}_{h}_{l}-{i}.schem", "wb") as f:
            f.write(snakenbt.dumps(schem.format_as_schem()))

if __name__ == "__main__":

    generate_debug_output()

    #debug_network()

    pass