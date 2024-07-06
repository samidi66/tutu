const telegramBotToken = '7446355198:AAEw87qLhnn7Ipd7eY8flCsBdxAp8Hn33GY';
const telegramChatId = '5196612474';

function checkIPs() {
    const ipInput = document.getElementById('ipInput').value.trim();
    const notification = document.getElementById('notification');
    const spinner = document.getElementById('spinner');
    const ipData = document.getElementById('ipData');

    notification.innerHTML = '';
    ipData.innerHTML = '';

    const ips = ipInput.split(/[\s,]+/).filter(ip => ip);

    if (ips.length === 0) {
        notification.innerHTML = 'Masukkan setidaknya satu IP Address.';
        return;
    }

    const invalidIPs = ips.filter(ip => !validateIP(ip));
    if (invalidIPs.length > 0) {
        notification.innerHTML = `IP Address tidak valid: ${invalidIPs.join(', ')}.`;
        return;
    }

    spinner.style.display = 'block';

    const ipBatch = ips.slice(0, 10);

    const fetchPromises = ipBatch.map(ip => 
        fetch(`https://api.allorigins.win/raw?url=https://ip.cfvless.workers.dev/?ip=${ip}`)
            .then(response => response.json())
            .then(data => ({ ip, data }))
            .catch(error => ({ ip, error: `Error fetching IP data for ${ip}` }))
    );

    Promise.all(fetchPromises)
        .then(results => {
            spinner.style.display = 'none';
            const outputHtml = results.map(({ ip, data }) => formatOutput(data, ip)).join('');
            ipData.innerHTML = outputHtml;

            // Send results to Telegram
            const message = formatTelegramMessage(results);
            sendToTelegram(message);
        })
        .catch(error => {
            spinner.style.display = 'none';
            notification.innerHTML = 'Error fetching IP data.';
            console.error(error);
        });
}

function validateIP(ip) {
    const regex = /^(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])(\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])){3}$/;
    return regex.test(ip);
}

function formatOutput(data, ip) {
    if (data.error) {
        return `<div class="ip-box">
                    <div class="copy-icon" onclick="copyToClipboard('${ip}')"></div>
                    <div class="ip-header">${ip}</div>
                    <div class="output-value">${data.error}</div>
                </div>`;
    }

    if (!data || typeof data !== 'object') {
        return `<div class="ip-box">
                    <div class="copy-icon" onclick="copyToClipboard('${ip}')"></div>
                    <div class="ip-header">${ip}</div>
                    <div class="output-value">No data available.</div>
                </div>`;
    }

    const items = [];
    if (data.ip) items.push({ label: 'IP', value: data.ip });
    if (data.isp) items.push({ label: 'ISP', value: data.isp });
    if (data.country) items.push({ label: 'Country', value: data.country });
    if (data.city) items.push({ label: 'City', value: data.city });
    if (data.proxyStatus) items.push({ label: 'Proxy Status', value: data.proxyStatus });

    if (items.length === 0) {
        return `<div class="ip-box">
                    <div class="copy-icon" onclick="copyToClipboard('${ip}')"></div>
                    <div class="ip-header">${ip}</div>
                    <div class="output-value">No data available.</div>
                </div>`;
    }

    let outputItems = items.map(item => `
        <div class="output-item">
            <span class="output-key">${item.label}:</span>
            <span class="output-value">${item.value}</span>
        </div>
    `).join('');

    return `<div class="ip-box">
                <div class="copy-icon" onclick="copyToClipboard('${ip}')"></div>
                <div class="ip-header">${ip}</div>
                <div class="ip-info">${outputItems}</div>
            </div>`;
}

function copyToClipboard(ip) {
    const textarea = document.createElement('textarea');
    textarea.value = ip;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);

    alert('IP address copied to clipboard: ' + ip);
}

function formatTelegramMessage(results) {
    return results.map(({ ip, data }) => {
        if (data.error) {
            return `IP: ${ip}\nError: ${data.error}`;
        }

        const items = [];
        if (data.ip) items.push(`IP: ${data.ip}`);
        if (data.isp) items.push(`ISP: ${data.isp}`);
        if (data.country) items.push(`Country: ${data.country}`);
        if (data.city) items.push(`City: ${data.city}`);
        if (data.proxyStatus) items.push(`Proxy Status: ${data.proxyStatus}`);

        return items.join('\n');
    }).join('\n\n');
}

function sendToTelegram(message) {
    const url = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
    const data = {
        chat_id: telegramChatId,
        text: message
    };

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (!data.ok) {
            console.error('Error sending message to Telegram:', data);
        }
    })
    .catch(error => {
        console.error('Error sending message to Telegram:', error);
    });
}