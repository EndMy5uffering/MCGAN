import random
from collections.abc import Collection


class Randomizer:

    def randomize(hparams: dict, ranges: dict):
        """
        Randomizes values in the `hparams` dictionary based on the corresponding entries in `ranges`.

        Behavior:
        - If a value in `ranges` is a tuple `(min, max)`, the corresponding key in `hparams` will be
        set to a random value uniformly sampled between `min` and `max`.
        - If a value in `ranges` is a list, the corresponding key in `hparams` will be set to a random
        element selected from that list.
        - If the value in `hparams` is itself a list, the same randomization rule is applied **to each
        element** of the list using the same rule from `ranges`. The shape/length of the list in 
        `hparams` is preserved.

        Parameters:
        ----------
        hparams : dict
            A dictionary of hyperparameter names and their initial values. These may include scalar 
            values or lists of values.
        
        ranges : dict
            A dictionary mapping the same keys as `hparams` to either:
            - A tuple `(min, max)` indicating the range for uniform random sampling,
            - A list of discrete options to randomly select from.

        Returns:
        -------
        dict
            The updated `hparams` dictionary with randomized values.
        """
        for key, val in ranges.items():
            if key in hparams.keys():
                if isinstance(hparams[key], Collection) and not isinstance(hparams[key], str):
                    if isinstance(val, tuple):
                        hparams[key] = (random.uniform(min, max) for min, max in val)
                    else:
                        hparams[key] = (random.choice(e) for e in val)
                elif isinstance(val, list):
                    hparams[key] = random.choice(val)
                else:
                    hparams[key] = random.uniform(val[0], val[1])
        return hparams