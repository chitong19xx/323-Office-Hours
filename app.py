from flask import Flask

number_in_queue = 0

app = Flask(__name__)
@app.route('/')
def report_queue_size():
    return "The queue has "+str(number_in_queue)+" people in it."

@app.route('/change/<int:size>')
def change_queue_size(size):
    global number_in_queue
    number_in_queue = size
    return "Done"

if __name__ == '__main__':
    app.run(debug=True, use_reloader=True)
