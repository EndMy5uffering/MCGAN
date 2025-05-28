import torch
import torch.nn as nn
import torchvision.transforms as transforms
from pathlib import Path
from tqdm import tqdm
import socket


def quickLoad(batchsize = 32, shuffle = True, normalized=False, datapath: Path = "./network/datasets/compact_set_02.pt") -> tuple[torch.utils.data.DataLoader, list[str]]:

    reNorm = lambda x : x

    x = torch.load(datapath, weights_only=False)
    if normalized:
        max_val: int = max(x["pallet"].values())
        x["data"] = [{"dim": e["dim"], "data": (e["data"]/max_val)} for e in x["data"]] 
        reNorm = lambda x: x * max_val
    return torch.utils.data.DataLoader(x["data"], batchsize, shuffle), x["pallet"], reNorm

def quickLoad_overfit(batchsize = 32, shuffle = True, normalized=False, datapath: Path = "./network/datasets/compact_set_02.pt", sample=0, samplesize=1000) -> tuple[torch.utils.data.DataLoader, list[str]]:

    reNorm = lambda x : x

    raw = torch.load(datapath, map_location='cpu', weights_only=False)
    if normalized:
        max_val: int = max(raw["pallet"].values())
        raw["data"] = [{"dim": e["dim"], "data": (e["data"]/max_val)} for e in raw["data"]] 
        reNorm = lambda x: x * max_val
    dataloader = torch.utils.data.DataLoader([raw["data"][sample] for _ in tqdm(range(0, samplesize), total=samplesize)], batchsize, shuffle)
    return dataloader, raw["pallet"], reNorm



