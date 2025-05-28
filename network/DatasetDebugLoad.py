import gzip
import snakenbt as snakenbt
from pathlib import Path
import numpy as np
from NBTSchematic import Schematic
import matplotlib.pyplot as plt
from tqdm import tqdm
from glob import glob
import torch


def save_schem_from_raw(data: torch.tensor, dims: torch.tensor, pallet, savePathSubFolder: Path = Path("./")):
    w, h, l = dims.tolist()[0], dims.tolist()[1], dims.tolist()[2]

    output_data = np.array(data.tolist()).reshape(85,85,85)[:h,:l,:w]

    schem = Schematic(w, h, l, pallet)
    schem.data = schem.convert_np_data_to_bytes(output_data)

    if not (Path('./Network_Output/')/savePathSubFolder).exists():
        (Path('./Network_Output/')/savePathSubFolder).mkdir()

    with gzip.open(Path('./Network_Output/')/savePathSubFolder/f"From_Raw_schem.schem", "wb") as f:
        f.write(snakenbt.dumps(schem.format_as_schem()))

if __name__ == '__main__':
    i = 50
    x = torch.load("./network/datasets/compact_set_02.pt")
    #print(x["data"][0]["data"])
    save_schem_from_raw(x["data"][i]["data"], x["data"][i]["dim"], x["pallet"], Path("debug2"))