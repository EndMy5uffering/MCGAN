import torch
import torch.nn as nn
import torchvision.transforms as transforms
from pathlib import Path
from tqdm import tqdm

def load_train(batchsize = 32, shuffle = True, norm_factor=26684, datapath: Path = "./datasets/data_set_tree_03.csv") -> torch.utils.data.DataLoader:

    with open(datapath, "r") as f:
        lines = f.readlines()
        data = [None] * len(lines)
        for i, l in tqdm(enumerate(lines), total=len(lines)):
            lsp = l.strip("\n").split(",")
            d = {
                "dim": torch.tensor([int(lsp[0]), int(lsp[1]), int(lsp[2])]), 
                "data": torch.tensor([(float(n)/norm_factor) for n in lsp[3:]])
            }
            data[i] = d
        dataloader = torch.utils.data.DataLoader(data, batchsize, shuffle)
        
    return dataloader