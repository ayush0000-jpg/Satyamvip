document.addEventListener('DOMContentLoaded', function() {
    const predictedNumberElement = document.getElementById('predictedNumber');
    const timerElement = document.getElementById('timeRemaining');
    const issueNumberElement = document.getElementById('issueNumber');
    const refreshButton = document.getElementById('refreshButton');

    let currentIssueNumber = null; // Variable to store the current issue number

    const fetchNoAverageEmerdList = () => {
        const requestData = {
            pageSize: 10,
            pageNo: 1,
            typeId: 1,
            language: 0,
            random: "ded40537a2ce416e96c00e5218f6859a",
            signature: "69306982EEEB19FA940D72EC93C62552",
            timestamp: 1721383261
        };

        return fetch('https://api.bdg88zf.com/api/webapi/GetNoaverageEmerdList', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json;charset=UTF-8',
                'Accept': 'application/json, text/plain, */*'
            },
            body: JSON.stringify(requestData)
        })
        .then(response => response.json())
        .catch(error => console.error('Error fetching no average EMERD list data:', error));
    };

    const fetchGameIssue = () => {
        const requestData = {
            typeId: 1,
            language: 0,
            random: "e7fe6c090da2495ab8290dac551ef1ed",
            signature: "1F390E2B2D8A55D693E57FD905AE73A7",
            timestamp: 1723726679
        };

        return fetch('https://api.bdg88zf.com/api/webapi/GetGameIssue', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json;charset=UTF-8',
                'Accept': 'application/json, text/plain, */*'
            },
            body: JSON.stringify(requestData)
        })
        .then(response => response.json())
        .catch(error => console.error('Error fetching game issue:', error));
    };

    const categorizeNumber = (number) => {
        if (number >= 0 && number <= 4) {
            return 'Small';
        } else if (number >= 5 && number <= 9) {
            return 'Big';
        } else {
            return 'Unknown';
        }
    };

    const predictNextNumber = (list) => {
        if (list.length < 2) {
            return { category: 'N/A' };
        }

        const recentNumbers = list.slice(0, 5).map(item => Number(item.number));
        if (recentNumbers.length < 2) return { category: 'N/A' };

        const sum = recentNumbers.reduce((a, b) => a + b, 0);
        const average = sum / recentNumbers.length;
        const trend = recentNumbers.length >= 2 ? recentNumbers[0] - recentNumbers[1] : 0;
        const predictedNumber = Math.round(average + trend);
        const clampedNumber = Math.max(0, Math.min(9, predictedNumber));
        const predictedCategory = categorizeNumber(clampedNumber);

        return {
            category: predictedCategory
        };
    };

    const updateDataAndPrediction = () => {
        fetchNoAverageEmerdList()
            .then(data => {
                if (!data.data || !data.data.list || data.data.list.length === 0) {
                    console.error('No data received for no average EMERD list.');
                    return;
                }

                const list = data.data.list;
                const prediction = predictNextNumber(list);

                // Update prediction display
                predictedNumberElement.textContent = `BET:-\n\n${prediction.category}`;

                // Get the current issue number (latest in the list)
                const newIssueNumber = list[0].issueNumber;

                if (currentIssueNumber !== newIssueNumber) {
                    currentIssueNumber = newIssueNumber;
                    // Update issue number display
                    issueNumberElement.textContent = `Period: ${currentIssueNumber}`;
                }

                // Save the latest prediction to local storage
                lastPrediction = {
                    issueNumber: currentIssueNumber,
                    category: prediction.category
                };
                localStorage.setItem('lastPrediction', JSON.stringify(lastPrediction));
            })
            .catch(error => console.error('Error fetching no average EMERD list data:', error));
    };

    const updateTimer = () => {
        fetchGameIssue()
            .then(data => {
                if (!data.data) {
                    console.error('No data received for game issue.');
                    return;
                }

                const { endTime, intervalM, issueNumber } = data.data;
                if (!endTime || !intervalM) {
                    console.error('Incomplete data received for game issue.');
                    return;
                }

                const endDate = new Date(endTime);
                const intervalMs = intervalM * 60 * 1000; // Convert minutes to milliseconds
                const now = new Date();
                const remainingTimeMs = endDate - now;

                if (remainingTimeMs <= 0) {
                    timerElement.textContent = "00:00";
                    clearInterval(timerInterval);

                    // Delay new issue number request by 3 seconds
                    setTimeout(() => {
                        updateDataAndPrediction(); // Fetch new data and predictions
                        fetchGameIssue()
                            .then(data => {
                                if (!data.data) {
                                    console.error('No data received for new game issue.');
                                    return;
                                }

                                const newIssueNumber = data.data.issueNumber;
                                if (currentIssueNumber !== newIssueNumber) {
                                    currentIssueNumber = newIssueNumber;
                                    issueNumberElement.textContent = `Period: ${newIssueNumber}`;
                                }
                            })
                            .catch(error => console.error('Error fetching new game issue data:', error));
                    }, 3000);

                    // Restart the timer
                    timerInterval = setInterval(updateTimer, 1000);
                } else {
                    const minutes = String(Math.floor((remainingTimeMs % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
                    const seconds = String(Math.floor((remainingTimeMs % (1000 * 60)) / 1000)).padStart(2, '0');
                    timerElement.textContent = `00:${minutes}:${seconds}`;
                }

                // Update issue number immediately
                if (currentIssueNumber !== issueNumber) {
                    currentIssueNumber = issueNumber;
                    issueNumberElement.textContent = `Period: ${currentIssueNumber}`;
                }
            })
            .catch(error => console.error('Error fetching game issue:', error));
    };

    // Fetch initial data and start the timer
    updateDataAndPrediction();
    let timerInterval = setInterval(updateTimer, 1000);

    // Add event listener to the refresh button
    refreshButton.addEventListener('click', () => {
        updateDataAndPrediction(); // Fetch new data and predictions
        fetchGameIssue()
            .then(data => {
                if (!data.data) {
                    console.error('No data received for new game issue.');
                    return;
                }

                const newIssueNumber = data.data.issueNumber;
                if (currentIssueNumber !== newIssueNumber) {
                    currentIssueNumber = newIssueNumber;
                    issueNumberElement.textContent = `Period: ${newIssueNumber}`;
                }
            })
            .catch(error => console.error('Error fetching new game issue data:', error));
    });
});