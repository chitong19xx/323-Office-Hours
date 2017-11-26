from flask import Flask
from flask import request
import json

DATA_PATH = "data.txt"

def get_data():
    try:
        with open(DATA_PATH, "r") as f:
            return json.load(f)
    except IOError:
        pass
    return {'size': 0, 'list': []}

def get_number_in_queue():
    return get_data()['size']

def set_number_in_queue(num):
    old_data = get_data()
    old_data['size'] = num
    with open(DATA_PATH, "w") as f:
        json.dump(old_data, f)

app = Flask(__name__)
@app.route('/')
def report_queue_size():
    return "The queue has "+str(get_number_in_queue())+" people in it."

@app.route('/change/<int:size>')
def change_queue_size(size):
    set_number_in_queue(size)
    return "Done"

@app.route('/set_list', methods=['POST'])
def set_list():
    json = request.get_json(force=True)


if __name__ == '__main__':
    app.run(debug=True, use_reloader=True)
