from flask import Flask, render_template, request, jsonify
import pyautogui
import time
from threading import Thread, Event

app = Flask(__name__)
progress = {}
stop_event = Event()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/process', methods=['POST'])
def process():
    data = request.json['data']
    items = data['items']
    quantities = data['quantities']
    return jsonify({'status': 'success', 'items': items, 'quantities': quantities})

def data_loader_thread(items, quantities):
    global progress, stop_event
    time.sleep(10)  # Initial delay before starting the process

    for index, (item, quantity) in enumerate(zip(items, quantities)):
        if stop_event.is_set():
            progress['stopped_at'] = index + 1
            break
        if index == 0:
            time.sleep(5)  # Additional delay for the first line

        # Dynamic delay logic for the first 5 lines
        if index < 5:
            delay = 1.0 - (index * 0.1)  # Start at 1 second and reduce by 0.1 each line
        else:
            delay = 0.5  # Normal delay

        pyautogui.typewrite(item)
        pyautogui.press('tab')
        pyautogui.typewrite(quantity)
        pyautogui.press('tab')
        pyautogui.press('enter')
        time.sleep(delay)
        progress['line'] = index + 1
    else:
        progress['done'] = True

@app.route('/start_loader', methods=['POST'])
def start_loader():
    global progress, stop_event
    stop_event.clear()
    data = request.json
    items = data['items']
    quantities = data['quantities']
    
    progress = {'line': 0, 'done': False, 'stopped_at': None}
    thread = Thread(target=data_loader_thread, args=(items, quantities))
    thread.start()
    
    return jsonify({'status': 'started'})

@app.route('/stop_loader', methods=['POST'])
def stop_loader():
    global stop_event
    stop_event.set()
    return jsonify({'status': 'stopped'})

@app.route('/progress', methods=['GET'])
def get_progress():
    global progress
    return jsonify(progress)

if __name__ == '__main__':
    app.run(debug=True)

