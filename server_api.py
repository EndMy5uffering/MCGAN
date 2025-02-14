from flask import Flask, send_from_directory, jsonify, request, abort, send_file
from flask_cors import CORS
import os
import waitress
from glob import glob
import uuid
from pathlib import Path
import os
import json


SCHEM_FOLDER = Path("./Network_Output")
BLOCK_MODEL_FOLDER = Path("./mc_model_data/__mc_model_data")
TEXTUREMAP_PATH = Path("./mc_model_data/__mc_model_data/block_textures.png")


app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    print(f"Unknown request: {path}")
    return {"message": "hello world", "path": path}

@app.route('/api/schematics', methods=['GET'])
def schematics():
    return jsonify([{
        "id": uuid.uuid4(),
        "fileName": Path(file).stem,
        "dimensions": [69,42,247],
        "fileSize": os.stat(file).st_size,
        "creationDate": os.stat(file).st_birthtime,
    } for file in glob(str(SCHEM_FOLDER / "*.schem"))])

@app.route('/api/modeldata', methods=['GET'])
def modeldata():
    schematicname = request.args.get('schematicname', None)
    if not schematicname:
        print("No schematic name was specifyed!")
        abort(404)

    schem_path = SCHEM_FOLDER / f"{schematicname}.schem"

    if not schem_path.exists():
        print(f"Requested schematic dose not exist! Name: {schematicname}")
        abort(404)
    
    return send_file(schem_path, download_name=schematicname+".schem", as_attachment=True)


@app.route('/api/blockdata/blocks', methods=['POST'])
def blockdata():
    #block_model = request.args.get('blockname', None)
    body = request.get_json()

    result = []
    for block_model in body:

        model_path = BLOCK_MODEL_FOLDER / f"{block_model}.json"

        if not model_path.exists():
            print(f"Requested schematic dose not exist! Name: {block_model}")
            continue
            #abort(404)
        
        with open(model_path, 'r') as model:
            jmodel = json.load(model)
            result.append(jmodel)
    

    return jsonify(result)


#@app.route('/api/texturemap')
#def texturemap():
#    return send_file(TEXTUREMAP_PATH)

if __name__ == '__main__':
    print("Starting server on: 'localhost:8000'")
    waitress.serve(app, port=8000)
