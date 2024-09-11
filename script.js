function visualize() {
    const algorithm = document.getElementById('algorithm').value;
    const processes = document.getElementById('processes').value.split(',');
    const burstTimes = document.getElementById('burstTimes').value.split(',').map(Number);
    const arrivalTimes = document.getElementById('arrivalTimes').value.split(',').map(Number);
    const priorities = document.getElementById('priorities').value.split(',').map(Number);
    const timeQuantum = parseInt(document.getElementById('timeQuantum').value);

    let schedule;
    switch (algorithm) {
        case 'fcfs':
            schedule = fcfs(processes, burstTimes, arrivalTimes);
            break;
        case 'sjf':
            schedule = sjf(processes, burstTimes, arrivalTimes);
            break;
        case 'srjf':
            schedule = srjf(processes, burstTimes, arrivalTimes);
            break;
        case 'rr':
            schedule = roundRobin(processes, burstTimes, arrivalTimes, timeQuantum);
            break;
        case 'priority':
            schedule = priorityScheduling(processes, burstTimes, arrivalTimes, priorities);
            break;
    }

    drawGanttChart(schedule);
    calculateAverages(schedule, processes.length);
}

function fcfs(processes, burstTimes, arrivalTimes) {
    const n = processes.length;
    let currentTime = 0;
    const schedule = [];

    const sortedIndices = arrivalTimes.map((_, index) => index)
        .sort((a, b) => arrivalTimes[a] - arrivalTimes[b]);

    for (let i = 0; i < n; i++) {
        const index = sortedIndices[i];
        if (currentTime < arrivalTimes[index]) {
            currentTime = arrivalTimes[index];
        }
        schedule.push({
            process: processes[index],
            start: currentTime,
            end: currentTime + burstTimes[index]
        });
        currentTime += burstTimes[index];
    }

    return schedule;
}

function sjf(processes, burstTimes, arrivalTimes) {
    const n = processes.length;
    let currentTime = 0;
    const schedule = [];
    const remainingBurstTimes = [...burstTimes];
    const completed = new Array(n).fill(false);

    while (schedule.length < n) {
        let shortestJobIndex = -1;
        let shortestBurstTime = Infinity;

        for (let i = 0; i < n; i++) {
            if (!completed[i] && arrivalTimes[i] <= currentTime && remainingBurstTimes[i] < shortestBurstTime) {
                shortestJobIndex = i;
                shortestBurstTime = remainingBurstTimes[i];
            }
        }

        if (shortestJobIndex === -1) {
            currentTime++;
            continue;
        }

        schedule.push({
            process: processes[shortestJobIndex],
            start: currentTime,
            end: currentTime + remainingBurstTimes[shortestJobIndex]
        });

        currentTime += remainingBurstTimes[shortestJobIndex];
        completed[shortestJobIndex] = true;
    }

    return schedule;
}

function srjf(processes, burstTimes, arrivalTimes) {
    const n = processes.length;
    let currentTime = 0;
    const schedule = [];
    const remainingBurstTimes = [...burstTimes];
    const completed = new Array(n).fill(false);

    while (completed.some(c => !c)) {
        let shortestJobIndex = -1;
        let shortestRemainingTime = Infinity;

        for (let i = 0; i < n; i++) {
            if (!completed[i] && arrivalTimes[i] <= currentTime && remainingBurstTimes[i] < shortestRemainingTime) {
                shortestJobIndex = i;
                shortestRemainingTime = remainingBurstTimes[i];
            }
        }

        if (shortestJobIndex === -1) {
            currentTime++;
            continue;
        }

        const lastScheduleItem = schedule[schedule.length - 1];
        if (lastScheduleItem && lastScheduleItem.process === processes[shortestJobIndex]) {
            lastScheduleItem.end = currentTime + 1;
        } else {
            schedule.push({
                process: processes[shortestJobIndex],
                start: currentTime,
                end: currentTime + 1
            });
        }

        remainingBurstTimes[shortestJobIndex]--;
        currentTime++;

        if (remainingBurstTimes[shortestJobIndex] === 0) {
            completed[shortestJobIndex] = true;
        }
    }

    return schedule;
}

function roundRobin(processes, burstTimes, arrivalTimes, timeQuantum) {
    const n = processes.length;
    let currentTime = 0;
    const schedule = [];
    const remainingBurstTimes = [...burstTimes];
    const queue = [];
    const completed = new Array(n).fill(false);

    while (completed.some(c => !c)) {
        for (let i = 0; i < n; i++) {
            if (!completed[i] && arrivalTimes[i] <= currentTime && !queue.includes(i)) {
                queue.push(i);
            }
        }

        if (queue.length === 0) {
            currentTime++;
            continue;
        }

        const processIndex = queue.shift();
        const executionTime = Math.min(timeQuantum, remainingBurstTimes[processIndex]);

        schedule.push({
            process: processes[processIndex],
            start: currentTime,
            end: currentTime + executionTime
        });

        currentTime += executionTime;
        remainingBurstTimes[processIndex] -= executionTime;

        if (remainingBurstTimes[processIndex] === 0) {
            completed[processIndex] = true;
        } else {
            queue.push(processIndex);
        }
    }

    return schedule;
}

function priorityScheduling(processes, burstTimes, arrivalTimes, priorities) {
    const n = processes.length;
    let currentTime = 0;
    const schedule = [];
    const remainingBurstTimes = [...burstTimes];
    const completed = new Array(n).fill(false);

    while (completed.some(c => !c)) {
        let highestPriorityIndex = -1;
        let highestPriority = Infinity;

        for (let i = 0; i < n; i++) {
            if (!completed[i] && arrivalTimes[i] <= currentTime && priorities[i] < highestPriority) {
                highestPriorityIndex = i;
                highestPriority = priorities[i];
            }
        }

        if (highestPriorityIndex === -1) {
            currentTime++;
            continue;
        }

        schedule.push({
            process: processes[highestPriorityIndex],
            start: currentTime,
            end: currentTime + remainingBurstTimes[highestPriorityIndex]
        });

        currentTime += remainingBurstTimes[highestPriorityIndex];
        completed[highestPriorityIndex] = true;
    }

    return schedule;
}

function drawGanttChart(schedule) {
    const ganttChart = document.getElementById('ganttChart');
    ganttChart.innerHTML = '';

    const totalTime = schedule[schedule.length - 1].end;
    const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#34495e', '#95a5a6'];

    schedule.forEach((item, index) => {
        const width = ((item.end - item.start) / totalTime) * 100;
        const bar = document.createElement('div');
        bar.className = 'gantt-bar';
        bar.style.width = `${width}%`;
        bar.style.backgroundColor = colors[index % colors.length];
        bar.textContent = `${item.process} (${item.start}-${item.end})`;
        ganttChart.appendChild(bar);
    });
}

function calculateAverages(schedule, numProcesses) {
    const processInfo = {};
    let totalWaitingTime = 0;
    let totalTurnaroundTime = 0;

    schedule.forEach(item => {
        if (!processInfo[item.process]) {
            processInfo[item.process] = {
                startTime: item.start,
                endTime: item.end
            };
        } else {
            processInfo[item.process].endTime = item.end;
        }
    });

    for (const [process, info] of Object.entries(processInfo)) {
        const turnaroundTime = info.endTime - info.startTime;
        const waitingTime = turnaroundTime - (info.endTime - info.startTime);
        totalTurnaroundTime += turnaroundTime;
        totalWaitingTime += waitingTime;
    }

    const avgWaitingTime = totalWaitingTime / numProcesses;
    const avgTurnaroundTime = totalTurnaroundTime / numProcesses;

    const averagesDiv = document.getElementById('averages');
    averagesDiv.innerHTML = `
        <h3>Averages:</h3>
        <p>Average Waiting Time: ${avgWaitingTime.toFixed(2)}</p>
        <p>Average Turnaround Time: ${avgTurnaroundTime.toFixed(2)}</p>
    `;
}
