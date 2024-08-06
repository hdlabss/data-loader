function processData() {
    let dataInput = document.getElementById('dataInput').value;
    let lines = dataInput.trim().split('\n');
    
    let items = [];
    let quantities = [];

    lines.forEach(line => {
        let parts = line.split('\t');
        if (parts.length === 2) {
            items.push(parts[0]);
            quantities.push(parts[1]);
        }
    });

    if (items.length === 0 || quantities.length === 0) {
        alert('Please enter valid tab-separated data.');
        return;
    }

    let parsedData = '<table border="1"><tr><th>Item Number</th><th>Quantity</th></tr>';
    for (let i = 0; i < items.length; i++) {
        parsedData += `<tr><td>${items[i]}</td><td>${quantities[i]}</td></tr>`;
    }
    parsedData += '</table>';
    document.getElementById('parsedData').innerHTML = parsedData;

    // Store parsed data for later use
    window.parsedData = { items: items, quantities: quantities, totalLines: items.length };

    // Display checkmark
    document.getElementById('checkmark').style.display = 'inline';

    // Send data to the backend for processing
    fetch('/process', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: items, quantities: quantities }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            alert('Data parsed successfully!');
        } else {
            alert('Failed to parse data.');
        }
    });
}

function startDataLoader() {
    // Retrieve stored parsed data
    const data = window.parsedData;
    
    fetch('/start_loader', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'started') {
            alert('Data loader started successfully!');
            monitorProgress();
        } else {
            alert('Failed to start data loader.');
        }
    });
}

function stopDataLoader() {
    fetch('/stop_loader', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'stopped') {
            alert('Data loader stopped successfully!');
            monitorProgress(); // Update progress immediately
        } else {
            alert('Failed to stop data loader.');
        }
    });
}

function monitorProgress() {
    const progressDiv = document.getElementById('progress');
    function updateProgress() {
        fetch('/progress')
        .then(response => response.json())
        .then(data => {
            const totalLines = window.parsedData.totalLines;
            if (data.done) {
                progressDiv.innerHTML = `Data loading complete! (${totalLines} out of ${totalLines})`;
                clearInterval(progressInterval);
            } else if (data.stopped_at) {
                progressDiv.innerHTML = `Data loading stopped at line ${data.stopped_at} out of ${totalLines}`;
                clearInterval(progressInterval);
            } else {
                progressDiv.innerHTML = `Processing line ${data.line} out of ${totalLines}`;
            }
        });
    }
    const progressInterval = setInterval(updateProgress, 1000);
}

// Listen for the 'Esc' key to stop the data loader
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        stopDataLoader();
    }
});

