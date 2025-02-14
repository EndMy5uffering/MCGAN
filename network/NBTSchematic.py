from dataclasses import dataclass, field
import numpy as np
from scipy import ndimage
from snakenbt import TagShort, TagInt, TagIntArray
from typing import Generator


@dataclass
class Schematic:
    width:int  # X-Axis
    height:int # Y-Axis
    length:int # Z-Axis
    palette:dict[str, int] = field(default_factory=dict, repr=False)
    data:bytearray = field(default_factory=bytearray, repr=False) # YZX
    
    @classmethod
    def from_schem(cls, nbt_data) -> "Schematic":
        schem_nbt = nbt_data.get("Schematic", nbt_data)
        return cls(
            width = schem_nbt["Width"],
            height = schem_nbt["Height"],
            length = schem_nbt["Length"],
            
            palette = schem_nbt["Blocks"]["Palette"],
            data = schem_nbt["Blocks"]["Data"]
        )
        
    def format_as_schem(self):
        return {"Schematic": {
                    "Width": TagShort(self.width, "Width"),
                    "Height": TagShort(self.height, "Height"),
                    "Length": TagShort(self.length, "Length"),
                    "Offset": TagIntArray((0,0,0), "Offset"),
                    "Version": TagInt(3, "Version"),
                    "DataVersion": TagInt(3700, "DataVersion"),
                    "Blocks": {
                        "Palette": {k:TagInt(v, k) for k,v in self.palette.items()},
                        #"BlockEntities": list(),
                        "Data": self.data
                    }}}
        
    # @classmethod
    # def from_schematic(cls, nbt_data) -> "Schematic":
    #     raise NotImplementedError("Schematic file decoding not supported")
    #     schem_nbt = nbt_data.get("Schematic", nbt_data)
    #     return cls(
    #         width = schem_nbt["Width"],
    #         height = schem_nbt["Height"],
    #         length = schem_nbt["Length"],
            
    #         blocks = schem_nbt["Blocks"],
    #         data = schem_nbt["Data"]
    #     )
        
    # def format_as_schematic(self):
    #     raise NotImplementedError("Schematic file encoding not supported")
    #     pass
    
    def volume(self) -> int:
        return self.width*self.height*self.length
    
    def check(self) -> bool:
        return self.volume() == len(self.data)
    
    def get_as_3d(self) -> np.array:
        if self.check():
            np_data:np.ndarray[np.byte] = np.frombuffer(self.data, dtype=np.byte)
            if not np_data.flags["OWNDATA"]:
                np_data = np_data.copy()
            np_data.resize(self.height, self.length, self.width)
            return np_data
        else:
            np_data = np.empty(shape=self.volume(), dtype=np.int_)
            data_iter = iter(self.data)
            for i,x in enumerate(data_iter):
                val = x & 0x7F
                overflow = 0
                while x > 127:
                    x = next(data_iter)
                    overflow += 1
                    val += (x & 0x7F) << 7*overflow
                np_data[i] = val
            np_data.resize(self.height, self.length, self.width)
            return np_data
    
    def get_height_map(self, mask:int=None, np_data=None):
        if np_data is None:
            np_data = self.get_as_3d()
        if mask is None:
            mask = self.palette.get('minecraft:air', 0)
        valid_mask = np_data != mask
        height_map = -np.ones((np_data.shape[1], np_data.shape[2]), dtype=int)
        
        for x in range(np_data.shape[0] - 1, -1, -1):
            height_map[(valid_mask[x, :, :]) & (height_map == -1)] = x
            
        return height_map
    
    def get_floor_height(self, height_map=None) -> int:
        """Assumes the most frequent hight to be the floor"""
        if height_map is None:
            height_map = self.get_height_map()
        values, counts = np.unique(height_map, return_counts=True)
        return values[np.argmax(counts)]
        
    def get_features_map(self, floor_height:int=None, height_map=None):
        if height_map is None:
            height_map = self.get_height_map()
        else:
            height_map = height_map.copy()
        if floor_height is None:
            floor_height = self.get_floor_height()
        return ndimage.label((height_map > floor_height)*1, [[1,1,1]]*3)[0]
        
    def get_features(self, floor_height:int=None, height_map=None) -> list[tuple[slice, slice]]:
        feature_map = self.get_features_map(floor_height=floor_height, height_map=height_map)
        return ndimage.find_objects(feature_map)
    
    def get_sliced_clone(self, region: tuple[slice, slice, slice], np_data=None) -> "Schematic":
        """Region in YZX order"""
        if np_data is None:
            np_data = self.get_as_3d()
        return Schematic(
            width  = int(region[2].stop - region[2].start),   # X-Axis
            height = int(region[0].stop - region[0].start),   # Y-Axis
            length = int(region[1].stop - region[1].start),   # Z-Axis
            data = np_data[region].flatten().tobytes(),
            # data = bytearray(data[region].flatten()),
            # data = bytearray(np.buffer(data[region].flatten())),
            # data = np.array(self.data).reshape((self.height, self.length, self.width))[region].flatten().to_device,
            palette = self.palette
        )
    
    def separate(self) -> Generator["Schematic", None, None]:
        np_data = self.get_as_3d()
        height_map = self.get_height_map(np_data=np_data)
        floor_height = self.get_floor_height(height_map=height_map)
        bounding_boxes = self.get_features(floor_height=floor_height, height_map=height_map)
        
        for box in bounding_boxes:
            box_height_map = height_map[box]
            yield self.get_sliced_clone((slice(floor_height+1, box_height_map.max()), *box), np_data=np_data)
            
    # def clean_palette(self):
    #     blocks = set(self.data)
    #     self.palette = {k:v for k,v in self.palette.items() if v in blocks}
            
    def get_unknown_blocks(self, new_palette:dict[str, int]):
        return list(set(self.palette.keys()).difference(set(new_palette.keys())))
    
    def get_remapped_data(self, new_palette:dict[str, int], np_data=None, new_np_data=True):
        if e:=self.get_unknown_blocks(new_palette):
            raise LookupError(f"Could not Lookup these Blocks: {e}")
        new_palette = {k:new_palette.get(k, 0) for k in self.palette.keys()}
        conversion = {v:new_palette.get(k) for k,v in self.palette.items()}
        lookup_table = np.empty(shape=max(conversion.keys())+1, dtype=np.int_)
        for k,v in conversion.items():
            lookup_table[k] = v
        
        if np_data is None:
            np_data = self.get_as_3d()
        elif new_np_data:
            np_data = np_data.copy()
            
        np_data.flatten()
        np_data = lookup_table[np_data]
        np_data.resize(self.height, self.length, self.width)
        
        return np_data
    
    # def _stream_np_data_to_bytes(self, np_data):
    #     for x in np_data.flatten():
    #         while x >= 128:
    #             yield int(x % 128) | 0x80
    #             x //= 128
    #         yield x
    
    def convert_np_data_to_bytes(self, np_data, palette=None):
        if palette is None:
            palette = self.palette
        size = self.volume() * ((max(palette.values()).bit_length() + 6) // 7)
        data = bytearray(size)
        i = iter(range(size + 1))
        
        for x in np_data.flatten():
            while x >= 128:
                data[next(i)] = int(x % 128) | 0x80
                x //= 128
            data[next(i)] = x
        return bytes(data[:next(i)])
    
    def get_remaped_clone(self, new_palette:dict[str, int]):
        if e:=self.get_unknown_blocks(new_palette):
            raise LookupError(f"Could not Lookup these Blocks: {e}")
        new_palette = {k:new_palette.get(k, 0) for k in self.palette.keys()}
        return Schematic(
            width=self.width,
            height=self.height,
            length=self.length,
            palette=new_palette,
            data=self.convert_np_data_to_bytes(np_data=self.get_remapped_data(new_palette=new_palette), palette=new_palette)
        )
