from flask import Flask, send_from_directory
import os
import waitress


app = Flask(__name__, static_folder='./webend/dist')

# Serve React App
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        if path.endswith(".js"):
            response = send_from_directory(app.static_folder, path)
            response.headers['Content-Type'] = 'application/javascript'
            return response
        else:
            return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    print("Starting server on: 'localhost:8888'")
    waitress.serve(app, port=8888)
