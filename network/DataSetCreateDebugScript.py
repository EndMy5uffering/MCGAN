import gzip
import snakenbt as snakenbt
from pathlib import Path
import numpy as np
from NBTSchematic import Schematic
import matplotlib.pyplot as plt
from tqdm import tqdm
from glob import glob
import torch

FILE_NAME = "1k-trees"
FILE_NAME = "DebugWorld"
# FILE_NAME = "1k_sub1"
# FILE_NAME = "debug_separate"
# FILE_NAME = "1"

PATH_IN = Path("./schematics")
PATH_OUT = Path("./remapped")

"""
Fuck 

ab \x80 muss das nächste byte mit beachtet werden
nächstes byte zählt den roleover (128)
kann auch mehrere bytes lang werden

"""


def plot_3d_height_map(height_map):
        y_dim, z_dim = height_map.shape
        y = np.arange(y_dim)
        z = np.arange(z_dim)
        Y, Z = np.meshgrid(y, z, indexing='ij')

        fig = plt.figure()
        ax = fig.add_subplot(111, projection='3d')
        ax.plot_surface(Y, Z, height_map, cmap='viridis')
        plt.show()


def plot_2d_feature_map(feature_map):
        plt.figure()
        plt.imshow(feature_map)
        plt.show()

def debug():
    with gzip.open(PATH_IN/f"{FILE_NAME}.schem", "rb") as f:
        nbt_data = snakenbt.load(f)

    test = Schematic.from_schem(nbt_data=nbt_data)

    # plot_height_map(test.get_height_map())
    # height_map = test.get_height_map()
    # test.get_features(height_map=height_map)
    # plot_height_map(height_map=height_map)
    test.get_as_3d()
    plot_2d_feature_map(feature_map=test.get_features_map())
    # plot_feature_map(feature_map=test.get_as_3d()[3])
    # plot_feature_map(feature_map=test.get_height_map())

    (PATH_IN/FILE_NAME).mkdir(exist_ok=True)

    # for index,schem in enumerate(test.separate()):
    #     if schem.volume() < 50:
    #         continue
    #     with gzip.open(PATH/FILE_NAME/f"{FILE_NAME}-slice-{index}.schem", "wb") as f:
    #         f.write(snakenbt.dumps(schem.format_as_schem()))

    # with gzip.open(Path.cwd()/"__debug__"/"outputs"/f"{FILE_NAME}-new.schem", "wb") as f:
    #      f.write(snakenbt.dumps(test.format_as_schem()))

    # with open("debug.dump", "w") as f:
    #     f.write(str(test.data))

def debug_data_decoding():
    with gzip.open(PATH_IN/f"1k-trees.schem", "rb") as f:
        nbt_data = snakenbt.load(f)

    test = Schematic.from_schem(nbt_data=nbt_data)
    
        
    a = test.new_get_3d()
    
    print(a)

def debug_data_encoding():
    with gzip.open(PATH_IN/f"1k-trees.schem", "rb") as f:
        nbt_data = snakenbt.load(f)

    test = Schematic.from_schem(nbt_data=nbt_data)    
    data:list[int] = test.new_get_3d()
    """
    dec = 1000
    hex = 03E8
    bin = 0000 0011 1110 1000
    <<
    bin = 0000 0111 1110 1000
    hex = 07E8
    """
    
    size = test.volume() * ((max(test.palette.values()).bit_length() + 6) // 7)
    bt_data = bytearray(size)
    i = iter(range(size))
    
    for x in tqdm(data.flatten()):
        while x >= 128:
            bt_data[next(i)] = int(x % 128) | 0x80
            x //= 128
        bt_data[next(i)] = x
    bt_data = bytes(bt_data[:next(i)])
    
    print("Done")
    print(test.data == bt_data)
   

def seperate_schem_file(source_path:Path, output_path:Path, output_name:str=None):
    output_path.mkdir(exist_ok=True)
    if output_name is None:
        output_name = source_path.name.rsplit('.', 1)[0]
    
    with gzip.open(source_path, "rb") as f:
        source = Schematic.from_schem(nbt_data=snakenbt.load(f))
    
    if not source.check():
        print(f"Could not separate {source_path.parts[-1]}")
        return

    for index, schem in enumerate(source.separate()):
        if schem.volume() < 50:
            continue
        with gzip.open(output_path/f"{output_name}-{index}.schem", "wb") as f:
            f.write(snakenbt.dumps(schem.format_as_schem()))
            
    print(f"Separated {source_path.parts[-1]} into {index} schematics")
    

def remap_schem_file(source_path:Path, output_path:Path, new_palette:dict[str, int]):
    output_path.parent.mkdir(exist_ok=True)
    
    with gzip.open(source_path, "rb") as f:
        source = Schematic.from_schem(nbt_data=snakenbt.load(f))
    
    if unknown_blocks:=source.get_unknown_blocks(new_palette=new_palette):
        print(f"Found unknown blocks ... aborting: {unknown_blocks}")
        return
        
    with gzip.open(output_path, "wb") as f:
            f.write(snakenbt.dumps(source.get_remaped_clone(new_palette=new_palette).format_as_schem()))


def create_min_pallet():
    FILES = [Path(f).stem for f in glob('./schematics/*.schem')]

    outputPallet = set()
    for f in tqdm(FILES):
        with gzip.open(PATH_IN/f"{f}.schem", "rb") as schem:
            source: Schematic = Schematic.from_schem(nbt_data=snakenbt.load(schem))
            [outputPallet.add(e) for e in source.palette.keys()]

    with open("./Pallet.min.txt", "w+") as file:
        file.write("\n".join([e for e in outputPallet]))

if __name__ == '__main__':
    # debug_data_encoding()
    # print("minecraft:air ->", NORM_PALETTE["minecraft:air"])

    FILES = [Path(f).stem for f in glob('./schematics/*.schem')]

    with open(Path("Pallet.min.txt"), "r") as file:
        PALLET = {k: i for i, k in enumerate([e.strip() for e in file.readlines()])}
#
    #for f in tqdm(FILES):
    #    remap_schem_file(source_path=PATH_IN/f"{f}.schem",
    #                    output_path=PATH_OUT/f"{f}_R.schem",
    #                    new_palette=PALLET)

    mw, mh, ml = 0, 0, 0

    #with open("./data_set_tree_04.csv", "w") as output:
    #    for f in tqdm(FILES):
    #        with gzip.open(PATH_OUT/f"{f}_R.schem", "rb") as schem:
    #            source: Schematic = Schematic.from_schem(nbt_data=snakenbt.load(schem))
    #            data = source.get_as_3d()
    #            y = np.full((85,85,85), 0)
    #            y[:data.shape[0],:data.shape[1],:data.shape[2]] = data
    #            
    #            output.write(f"{','.join((str(source.width), str(source.height), str(source.length), *[str(n) for n in y.flatten()]))}\n")

    outputData = []
    outputPallet = set()
    for f in tqdm(FILES):
        with gzip.open(PATH_OUT/f"{f}_R.schem", "rb") as schem:
            source: Schematic = Schematic.from_schem(nbt_data=snakenbt.load(schem))
            data = source.get_as_3d()
            y = np.full((85,85,85), PALLET["minecraft:air"])
            y[:data.shape[0],:data.shape[1],:data.shape[2]] = data
            d = {
                "dim": torch.tensor([source.width, source.height, source.length]), 
                "data": torch.tensor(y.flatten()),
            }
            outputData.append(d)
            [outputPallet.add(e) for e in source.palette.keys()]
    torch.save({"data": outputData, "pallet": PALLET}, "./network/datasets/compact_set_02.pt")
    
    #x = np.full((2,3,8), 66)
    #print(x)
    #y = np.full((10,10,10), -1)
    #y[:x.shape[0],:x.shape[1],:x.shape[2]] = x
    #print(len(y.flatten()))
    # print("Done")
    # for file in files:
    #     seperate_schem_file(source_path=PATH/file,
    #                         output_path=PATH/"1k_sub")
    