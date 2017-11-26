from flask import Flask

DATA_PATH = "data.txt"

number_in_queue = 0

def get_number_in_queue():
    try:
        with open(DATA_PATH, "r") as f:
            for l in f:
                return int(l.strip())
    except IOError:
        pass
    return 0

def set_number_in_queue(num):
    with open(DATA_PATH, "w") as f:
        f.write(str(num) + "\n")

app = Flask(__name__)
@app.route('/')
def report_queue_size():
    return "The queue has "+str(get_number_in_queue())+" people in it."

@app.route('/change/<int:size>')
def change_queue_size(size):
    set_number_in_queue(size)
    return "Done"

if __name__ == '__main__':
    app.run(debug=True, use_reloader=True)
