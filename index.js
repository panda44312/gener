//载入node.js文件模块
const fs = require('fs');
const path = require('path');
const { ipcRenderer } = require('electron');
const { exec } = require('child_process');
const { execSync } = require('child_process');
const child_process = require('child_process');
const http = require('http');
const { console } = require('inspector');

const getRandomPort = () => {
    const min = 1024;
    const max = 65535;
    const commonPorts = [80, 443, 8080, 3306, 5432, 6379, 27017];
    let port;
    do {
        port = Math.floor(Math.random() * (max - min + 1)) + min;
    } while (commonPorts.includes(port));
    return port;
};

const port = getRandomPort();

//全局变量

const downloadUrl = 'https://github.com/comfyanonymous/ComfyUI/releases/latest/download/ComfyUI_windows_portable_nvidia.7z';
const gitUrl      = 'https://github.com/git-for-windows/git/releases/download/v2.47.1.windows.1/PortableGit-2.47.1-64-bit.7z.exe';
const modelUrl = '';

ipcRenderer.send('getUserDataPath');

ipcRenderer.on('userDataPath', (event, configPath) => {
     userDataPath      = configPath;
     comfyUIPath       = path.join(userDataPath, './ComfyUI/ComfyUI_windows_portable');
     comfyUIPathPython = path.join(comfyUIPath);
     modelPath         = path.join(comfyUIPath, './ComfyUI/models');
     historyPath       = path.join(comfyUIPath, './ComfyUI/output');
     gitPath           = path.join(comfyUIPath, './Git');
     customNodesPath           = path.join(comfyUIPath, './ComfyUI/custom_nodes');
     configManager = (() => {
        const configPath = userDataPath + '/gener/config.json';
    
        const loadConfig = () => {
            if (!fs.existsSync(configPath)) {
                fs.writeFileSync(configPath, JSON.stringify({}));
            }
            return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        };
    
        const saveConfig = (config) => {
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        };
    
        return {
            getConfig: (key, defaultValue) => {
                const config = loadConfig();
                if (!(key in config)) {
                    config[key] = defaultValue;
                    saveConfig(config);
                }
                return config[key];
            },
            updateConfig: (key, value, defaultValue) => {
                const config = loadConfig();
                if (value === undefined) {
                    if (!(key in config)) {
                        config[key] = defaultValue;
                    }
                } else {
                    config[key] = value;
                }
                saveConfig(config);
            }
        };
    })();    


    //载入
    window.addEventListener('DOMContentLoaded', () => {
        document.body.classList.add('on');
        
        //检测 ../ComfyUI文件夹是否存在，不存在就下载并解压
        const ComfyUIDir = path.join(userDataPath, './ComfyUI/ComfyUI_windows_portable/ComfyUI');

        //载入主题
        let themeColor = configManager.getConfig('themeColor', '#2196f3');
        const themeColorInput = $("#theme-color-input");
        themeColorInput.value = themeColor;
        let   themeColorStyle = document.createElement("div");
        themeColorStyle.innerHTML = `
            <style>
                :root {
                    --md-sys-color-primary: ${themeColor};
                    --md-sys-color-secondary: ${themeColor};
                    --md-list-container-color: ${themeColor}10;
                    --md-menu-item-selected-container-color: ${themeColor}30;
                    --md-sys-color-bg: ${themeColor}10;
                    --md-menu-container-color:  var(--app-bg);
                }
        `;
        document.head.appendChild(themeColorStyle);

        themeColorInput.oninput = () => {
            configManager.updateConfig('themeColor', themeColorInput.value);
            let   themeColor = configManager.getConfig('themeColor', '#2196f3');
            let   themeColorStyle = document.createElement("div");
            themeColorStyle.innerHTML = `
                <style>
                    :root {
                        --md-sys-color-primary: ${themeColor};
                        --md-sys-color-secondary: ${themeColor};
                        --md-list-container-color: ${themeColor}10;
                        --md-menu-item-selected-container-color: ${themeColor}30;
                        --md-sys-color-bg: ${themeColor}10;
                    }
            `;
            document.head.appendChild(themeColorStyle);
        }

        if (!fs.existsSync(ComfyUIDir)) {
            getComfyUIDir();
        } else {
            console.log('ComfyUI已存在，直接跳过下载和解压过程。');
            loadApp();
        }
    });
});

const $ = selector => {
    return document.querySelector(selector);
}

//函数库
const switchPage = (pageName) => {
    const pageContainer = $("#page-container");
    const pages = pageContainer.children;
    for (const page of pages) {
      if (page.classList.contains("active")) {
        page.style.display = "none"; // hide the active page instead of removing class
      }
    }
    const targetPage = Array.from(pages).find((page) => page.classList.contains(pageName));
    if (targetPage) {
      targetPage.classList.add("active");
      targetPage.style.display = "flex";
    }
}

const switchContainer = (e, pageName) => {
    const pageContainer = $(".page-main");
    let ee = $(`left-bar ${e}`);
    const pages = pageContainer.children;
    for (const page of pages) {
      if (page.classList.contains("active")) {
        page.style.display = "none"; // hide the active page instead of removing class
      }
    }
    const targetPage = Array.from(pages).find((page) => page.classList.contains(pageName));
    if (targetPage) {
      targetPage.classList.add("active");
      targetPage.style.display = "flex";
      //给e添加active class
        const buttons = ee.parentElement.children;
        for (const button of buttons) {
            button.classList.remove("active");
        }
        ee.classList.add("active");
    }
}


const terminal = (log) => {
    $("#terminal").textContent = $("#terminal").textContent += "\n" + log;
    $(".container-terminal").style.scrollBehavior = 'smooth';
    $(".container-terminal").scrollTop = 120000000000000000000000;
};

/* 窗口管理 */

const minimizeWindow = () => {
    ipcRenderer.send('minimize');
}

const closeWindow = () => {
    ipcRenderer.send('close');
}

const toggleTopmost = () => {
    ipcRenderer.send('toggle-topmost');
}

const getComfyUIDir = () => {
    switchPage("page-welcome"); // 切换到下载页面

    $('page #page-welcome-next').addEventListener('click', () => {

        switchPage("page-welcome-comfyui"); // 切换到下载页面
        

        fs.mkdirSync(comfyUIPath, {recursive: true});

        var progressBar = $('.page-welcome-comfyui #progress-bar');
        var progressText = $('.page-welcome-comfyui #progress-text');
        let xhr = new XMLHttpRequest();
        let startTime = Date.now();
        let receivedBytes = 0;
    
        // 配置请求
        xhr.open('GET', downloadUrl, true);
        xhr.responseType = 'arraybuffer'; // 将响应设置为二进制数据
    
        xhr.onprogress = (event) => {
            if (event.lengthComputable) {
                const totalLength = event.total;
                receivedBytes = event.loaded;
    
                // 计算进度
                const progress = (receivedBytes / totalLength) * 100;
                progressBar.value = progress;

                console.log(`${Math.round(progress)}%`);
            }
        };


        xhr.onload = async () => {
            if (xhr.status === 200) {
                const buffer = xhr.response; // 获取二进制数据
                console.log("File downloaded successfully.");
        
            try {   
        
                    // 目标文件夹
                    const extractDir = userDataPath;
        
                    // 确保目标文件夹存在
                    if (!fs.existsSync(extractDir)) {
                        fs.mkdirSync(extractDir, { recursive: true });
                    }
        
                    // 保存下载的文件
                    const downloadedFilePath = path.join(extractDir, "ComfyUI.7z");
                    
                    fs.writeFileSync(downloadedFilePath, Buffer.from(buffer));
        
                    console.log("File saved for extraction.");
                    switchPage("page-welcome-complete");
                    
                    // 执行7z.exe命令，执行完删除../7z.exe文件
                    const command = `"${path.join(process.cwd(), './7z.exe')}" x "${downloadedFilePath}" -o"${extractDir}/ComfyUI" -y`;

                    child_process.exec(command, (error, stdout, stderr) => {
                        if (error) {
                            openDialog('error', '解压失败', `解压失败。`);
                            switchPage("page-welcome");
                            return;
                        }
        
                        console.log("Extraction complete.");
                        $(".page-welcome-complete #next_text").textContent = "已经成功下载了 ComfyUI ，已完成解压。"
                        $(".page-welcome-complete #next").disabled = false;
                        $(".page-welcome-complete #progress-bar").indeterminate = false;
                        $(".page-welcome-complete #progress-bar").value = 100;
                        $(".page-welcome-complete #next").onclick = () => {
                            loadApp();
                        }
        
                        // 删除临时的下载文件
                        fs.unlinkSync(downloadedFilePath);
                        
                    });
        
                } catch (err) {
                    console.error("Error during extraction:", err);
                    openDialog('error', '解压失败', `解压失败。`);
                    switchPage("page-welcome");
                }
            } else {
                openDialog('error', '下载失败', `下载失败，状态码: ${xhr.status}`);
                switchPage("page-welcome");
            }
        };
        
        // 确保 xhr.responseType 设置为 arraybuffer
        xhr.responseType = "arraybuffer";
        
    
        xhr.onerror = () => {
            openDialog('error', '下载失败', '下载过程中发生错误。');
            switchPage("page-welcome");
        };
    
        xhr.send(); // 发送请求
    });        
    
}

const loadApp = () => {

    switchPage("page-main"); // 直接切换到主页面
    switchContainer("#home-button", "container-main"); // 切换到ComfyUI页面

    //创建子线程，以显示cpu和内存使用情况
    const sysinfo = () => {

        const AppBottomBar = $("#app-core-bottom-bar");

        exec('wmic cpu get loadpercentage', (err, stdout) => {
            if (err) {
                console.error(err);
                return;
            }
            const cpuLoad = stdout.split('\n')[1];
            AppBottomBar.querySelector('#cpu-load').textContent = `${cpuLoad}%`;
        })

        exec('wmic os get freephysicalmemory, totalvisiblememorysize', (err, stdout) => {
            if (err) {
            console.error(err);
            return;
            }
            const lines = stdout.split('\n');
            const freeMemory = parseInt(lines[1].split(/\s+/)[0]) * 1024;
            const totalMemory = parseInt(lines[1].split(/\s+/)[1]) * 1024;
            const usedMemory = totalMemory - freeMemory;
            const hardwareReservedMemory = 1024 * 1024 * 1024; // 1GB reserved for hardware
            const adjustedUsedMemory = usedMemory + hardwareReservedMemory;
            const memoryUsage = `${(adjustedUsedMemory / (1024 * 1024 * 1024)).toFixed(1)} GB/${(totalMemory / (1024 * 1024 * 1024)).toFixed(1)} GB`;
            AppBottomBar.querySelector('#memory-usage').textContent = memoryUsage;
        });

        //获取gpu使用情况
        exec('nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader', (err, stdout) => {
            if (err) {
                console.error(err);
                return;
            }
            const gpuLoad = stdout;
            AppBottomBar.querySelector('#gpu-load').textContent = `${gpuLoad}`;
        });

        //获取gpu显存占用情况
        exec('nvidia-smi --query-gpu=memory.used,memory.total --format=csv,noheader,nounits', (err, stdout) => {
            if (err) {
                console.error(err);
                return;
            }
            const lines = stdout.split('\n');
            const usedMemory = parseInt(lines[0].split(',')[0]) * 1024 * 1024; // Convert to bytes
            const totalMemory = parseInt(lines[0].split(',')[1]) * 1024 * 1024; // Convert to bytes
            const memoryUsage = `${(usedMemory / (1024 * 1024 * 1024)).toFixed(1)} GB/${(totalMemory / (1024 * 1024 * 1024)).toFixed(1)} GB`;
            AppBottomBar.querySelector('#gpu-memory-used').textContent = memoryUsage;

        });

    }

    sysinfo();
    setInterval(sysinfo, 1000);


    // 检测用户是否有显卡
    let comfyUIProcess;

    const generateButton = $("#app-core-image-generator #generate-button");

    Setrat = async () => {

        exec('taskkill /f /im python.exe');
        //人为等待一段时间
        const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
        await delay(20);
        console.log("等待结束，继续执行...");

        exec('wmic path win32_VideoController get name', (err, stdout, stderr) => {
            if (err) {
                openDialog('error', '显卡检测失败', '显卡检测过程中发生错误。');
                return;
            }
            if (stdout.includes("NVIDIA")) {
                console.log("NVIDIA显卡检测通过。");
                const command = `"python_embeded\\python.exe" -s ComfyUI\\main.py --fast --port ${port}`;
                comfyUIProcess = exec(command, {
                    cwd: comfyUIPathPython
                });

                comfyUIProcess.stderr.on('data', (data) => {
                    console.log(`stderr: ${data}`);
                    terminal(data)

                    if($("#comfy-ui-load").value != 1)
                        $("#comfy-ui-load").value = $("#comfy-ui-load").value + 0.05;

                    if (data.includes(`To see the GUI go to: http://127.0.0.1:${port}`)) {
                        $(".container-comfyui-web").src = `http://127.0.0.1:${port}`;
                        $("#comfy-ui-load").value = 1;
                        generateButton.disabled = false;
                        loadAppMain()
                    }

                });
                comfyUIProcess.on('close', (code) => {
                    if (code !== 0) {
                        openDialog('error', '启动失败', 'ComfyUI启动失败。');
                    } else {
                        console.log("ComfyUI started successfully with NVIDIA GPU.");
                    }
                });
            } else {
                openDialog('error', '显卡检测失败', '检测到您的电脑没有 NVIDIA 显卡， ComfyUI 将使用 CPU 运行，速度可能会较慢。');
                console.log("No NVIDIA GPU detected. Starting with CPU...");
            }
        });

    }
    
    Setrat()

    loadHistory = () => {
        const historyList = $(".container-history #history-list");
        historyList.innerHTML = ``;

        //fs获取historyPath中的文件，然后显示在historyList中
        fs.readdir(historyPath, (err, files) => {
            if (err) {
                console.error(err);
                return;
            }
            files.reverse().forEach(file => {
                if (file.endsWith('.png')) {
                    //创建 md-card 元素
                    const historyItem = document.createElement("md-card");
                    historyItem.className = 'ripple';
                    const uuid = generateUUID();
                    historyItem.innerHTML = `
                        <md-checkbox id="${uuid}"></md-checkbox>
                        <md-ripple></md-ripple>
                        <img src="http://127.0.0.1:${port}/view?filename=${file}&type=output">
                    `;
                    historyItem.querySelector('img').addEventListener('click', () => {
                        openImageViewer(`http://127.0.0.1:${port}/view?filename=${file}&type=output`);
                    });
                    historyList.appendChild(historyItem);
                }
            });

            // Add floating menu
            const floatingMenu = $(`.container-history-floating-menu`)

            const selectAllCheckbox = floatingMenu.querySelector('#select-all');
            const deleteSelectedButton = floatingMenu.querySelector('#delete-selected');

            selectAllCheckbox.addEventListener('change', () => {
                const isChecked = selectAllCheckbox.checked;
                historyList.querySelectorAll('md-checkbox').forEach(checkbox => {
                    checkbox.checked = isChecked;
                });
                updateSelectAllCheckboxState();
            });

            deleteSelectedButton.addEventListener('click', () => {
                const selectedFiles = [];
                historyList.querySelectorAll('md-checkbox').forEach(checkbox => {
                    if (checkbox.checked) {
                        const file = checkbox.closest('md-card').querySelector('img').src.split('filename=')[1].split('&')[0];
                        selectedFiles.push(file);
                    }
                });
                selectedFiles.forEach(file => {
                    deleteHistoryItem([file]);
                });
            });

            historyList.querySelectorAll('md-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', updateSelectAllCheckboxState);
            });
        });

        generateUUID = () => {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        };
    
        deleteHistoryItem = (files) => {
            try {
                files.forEach(file => {
                    fs.unlinkSync(path.join(historyPath, file));
                    const historyItem = Array.from(historyList.children).find(item => item.querySelector('img').src.includes(file));
                    if (historyItem) {
                        historyList.removeChild(historyItem);
                    }
                });
                updateSelectAllCheckboxState();
            } catch (err) {
                openDialog('error', '删除失败', '删除历史记录过程中发生错误。');
                console.error(err);
            }
        };
    
        updateSelectAllCheckboxState = () => {
            const checkboxes = historyList.querySelectorAll('md-checkbox');
            const checkedCheckboxes = Array.from(checkboxes).filter(checkbox => checkbox.checked);
            const selectAllCheckbox = $(`.container-history-floating-menu #select-all`);
            if (checkedCheckboxes.length === 0) {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
            historyList.classList.remove('checked');
            } else if (checkedCheckboxes.length === checkboxes.length) {
            selectAllCheckbox.checked = true;
            selectAllCheckbox.indeterminate = false;
            historyList.classList.add('checked');
            } else {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = true;
            historyList.classList.add('checked');
            }
        };
    }
    

    loadAppMain = () => {

        // modelPath载入到列表中
        const modelList = $(".container-model #model-list");
        const modelPathE = $(".container-model #model-path");
        const modelPathButton = $(".container-model #model-path-button");
        const modelSelect = $("#app-core-image-generator #model-select");
        modelList.innerHTML = ``;
        modelSelect.innerHTML = ``;
        
        modelPathE.value = path.join(modelPath, './checkpoints/');
        fs.readdir(modelPathE.value, (err, files) => {
            if (err) {
                console.error(err);
                return;
            }
            files.forEach(file => {
                if (file !== 'put_checkpoints_here') {
                    const modelItem = document.createElement("md-list-item");
                    modelItem.innerHTML = `
                        <md-icon selected slot="start">deployed_code</md-icon>
                        <span>${file}</span>
                        <md-text-button slot="end" onclick="deleteModel('${file}')">删除</md-text-button>
                    `;
                    modelList.appendChild(modelItem);
                    const modelOption = `
                        <md-select-option value="${file}">
                            <md-icon slot="start">deployed_code</md-icon>
                            ${file.split('.')[0]}
                        </md-select-option>
                    `;
                    modelSelect.insertAdjacentHTML('beforeend', modelOption);
                }
            });

            setTimeout(() => {
                modelSelect.value = files[0];
            }, 20);
        });

        //删除模型
        deleteModel = (file) => {
                const dialog = document.createElement('md-dialog');
                dialog.setAttribute('type', 'alert');
                dialog.innerHTML = `
                    <div slot="headline"><md-icon>delete</md-icon>确认删除</div>
                    <form slot="content" id="form-id" method="dialog">
                        您确定要删除模型 “${file}” 吗？
                    </form>
                    <div slot="actions">
                        <md-text-button form="form-id" value="cancel">取消</md-text-button>
                        <md-text-button form="form-id" value="delete">删除</md-text-button>
                    </div>
                `;
                document.body.appendChild(dialog);
            
                dialog.addEventListener('close', () => {
                    if (dialog.returnValue === 'delete') {
                        fs.unlink(path.join(modelPath, file), (err) => {
                            if (err) {
                                openDialog('error', '删除失败', '删除模型过程中发生错误。');
                                return;
                            }
                            const modelItem = Array.from(modelList.children).find(item => item.querySelector('span').textContent === file);
                            if (modelItem) {
                                modelList.removeChild(modelItem);
                            }
                        });
                    }
                    document.body.removeChild(dialog);
                });
            
                dialog.show();
            }

        modelPathButton.onclick = () => {
            const command = 'explorer.exe ' + modelPathE.value;
            exec(command, (err) => {
                if (err) {
                    console.error('Error opening file explorer:', err);
                }
            });
        }

        loadHistory()

        openImageViewer = (imageUrl) => {
            const viewer = document.createElement('div');
            viewer.classList.add('image-viewer');
            viewer.innerHTML = `
                <div class="image-viewer-overlay"></div>
                <div class="image-viewer-content">
                    <img src="${imageUrl}" alt="Image Viewer">
                    <md-icon-button class="image-viewer-download">
                        <md-icon>download</md-icon>
                    </md-icon-button>
                </div>
            `;
            document.body.appendChild(viewer);

            viewer.style.opacity = 0;
            viewer.style.transition = 'opacity 0.25s';
            requestAnimationFrame(() => {
                viewer.style.opacity = 1;
            });

            const overlay = viewer.querySelector('.image-viewer-overlay');
            overlay.addEventListener('click', () => {
                viewer.style.opacity = 0;
                viewer.addEventListener('transitionend', () => {
                    document.body.removeChild(viewer);
                }, { once: true });
            });

            const img = viewer.querySelector('img');
            img.addEventListener('click', (event) => {
                event.stopPropagation();
                if (img.classList.contains('zoomed')) {
                    img.classList.remove('zoomed');
                } else {
                    img.classList.add('zoomed');
                }
            });

            const downloadButton = viewer.querySelector('.image-viewer-download');

            downloadButton.addEventListener('click', () => {
                const link = document.createElement('a');
                link.href = imageUrl;
                link.download = imageUrl.split('/').pop();
                link.click();
            });
        }

        document.querySelectorAll('.container-history img').forEach(img => {
            img.addEventListener('click', () => {
                openImageViewer(img.src);
            });
        });

        //图片生成逻辑
        const imageLoadBtn = $("#app-core-image-generator #image-load-btn");
        
        imageLoadBtn.onclick = () => {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.multiple = true;
    
            fileInput.onchange = (event) => {
                const files = event.target.files;
                for (const file of files) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const img = document.createElement('img');
                        img.src = e.target.result;
                        img.classList.add('uploaded-image');
                        $("#app-core-image-viewer").appendChild(img);
                    };
                    reader.readAsDataURL(file);
                }
            };

            fileInput.click();
        }

        generateButton.onclick = () => {

            //获取完整数据
            const modelSelect = $("#app-core-image-generator #model-select");
            const textField = $("#app-core-image-generator #prompt");
            const sizeSelect = $("#app-core-image-generator #size-select");
            const steps = $("#app-core-image-generator #setps-slider");
            const batchSize = $("#app-core-image-generator #batch-size");
            const batchSizeA = $("#batch-size-a");

            if(batchSize.value === '0') {
            batchSize.value = 1;
            }

            if (steps.value === '0') {
            steps.value = 20;
            }

            if (modelSelect.value === '') {
            openDialog('error', '生成失败', '请选择一个模型。');
            return;
            }

            if (textField.value === '') {
            openDialog('error', '生成失败', '请输入一个提示词。');
            return;
            }

            let model = modelSelect.value;
            let prompt = textField.value;
            let size = sizeSelect.value;
            let stepsValue = steps.value;
            let sizeValue = size.split('x');
            if (size === 'custom') {
            sizeValue[0] = $("#width-num").value;
            sizeValue[1] = $("#height-num").value;
            }
            let batchSizeValue = batchSize.value;
            let batchSizeAValue = batchSizeA.value;

            generateButton.disabled = true;
            generateButton.textContent = "生成中...";

            for (let i = 0; i < batchSizeAValue; i++) {
            //创造向api请求的json, 由于使用的是 comfyUI，需要构造工作流
            const data = {
                "6": {
                "inputs": {
                "text": prompt,
                "clip": [
                "30",
                1
                ]
                },
                "class_type": "CLIPTextEncode",
                "_meta": {
                "title": "提示词"
                }
                },
                "8": {
                "inputs": {
                "samples": [
                "31",
                0
                ],
                "vae": [
                "30",
                2
                ]
                },
                "class_type": "VAEDecode",
                "_meta": {
                "title": "VAE解码"
                }
                },
                "9": {
                "inputs": {
                "filename_prefix": "ComfyUI",
                "images": [
                "8",
                0
                ]
                },
                "class_type": "SaveImage",
                "_meta": {
                "title": "保存图像"
                }
                },
                "27": {
                "inputs": {
                "width": sizeValue[0],
                "height": sizeValue[1],
                "batch_size": batchSizeValue
                },
                "class_type": "EmptySD3LatentImage",
                "_meta": {
                "title": "创建一个画布"
                }
                },
                "30": {
                "inputs": {
                "ckpt_name": model
                },
                "class_type": "CheckpointLoaderSimple",
                "_meta": {
                "title": "载入模型"
                }
                },
                "31": {
                "inputs": {
                "seed": Math.floor(Math.random() * Math.pow(2, 64)),
                "steps": stepsValue,
                "cfg": model.includes('flux') ? 1 : 8,
                "sampler_name": "euler",
                "scheduler": model.includes('flux') ? "simple" : "normal",
                "denoise": 1,
                "model": [
                "30",
                0
                ],
                "positive": [
                "6",
                0
                ],
                "negative": [
                "33",
                0
                ],
                "latent_image": [
                "27",
                0
                ]
                },
                "class_type": "KSampler",
                "_meta": {
                "title": "生成"
                }
                },
                "33": {
                "inputs": {
                "text": "",
                "clip": [
                "30",
                1
                ]
                },
                "class_type": "CLIPTextEncode",
                "_meta": {
                "title": "负面提示*"
                }
                }
            };

            fetch(`http://127.0.0.1:${port}/prompt`, {
                method: 'POST',
                headers: {
                'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                client_id: 'ComfyUI',
                prompt: data
                })
            })
            .catch(err => {
                openDialog('error', '生成失败', '生成过程中发生错误。');
            });

            const ws = new WebSocket(`ws://127.0.0.1:${port}/ws?clientId=ComfyUI`);

            ws.onopen = () => {
                console.log('WebSocket opened.');
            }

            const progressBar = $("#app-core-image-generator #progress-bar");

            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'progress') {
                progressBar.value = data.data.value;
                progressBar.max = data.data.max;
                }

                if (data.type === 'status') {
                const queueRemaining = data.data.status.exec_info.queue_remaining;
                console.log(`Queue remaining: ${queueRemaining}`);
                }

                if (data.type === 'execution_start') {
                const promptId = data.data.prompt_id;
                console.log(`Execution started for prompt ${promptId}`);
                }

                if (data.type === 'executing') {
                const node = data.data.node;
                const promptId = data.data.prompt_id;
                console.log(`Executing node ${node} for prompt ${promptId}`);
                
                if (node === null) {
                    const promptId = data.data.prompt_id;
                    fetch(`http://127.0.0.1:${port}/history/${promptId}`)
                    .then(response => response.json())
                    .then(data => {
                        console.log(data);

                        if(data[promptId].outputs == null) {
                        openDialog('error', '生成失败', '生成失败，ComfyUI 发生错误。');
                        console.log('No output images found.');
                        return;
                        }

                        const images = data[promptId].outputs['9'].images;
                        const imageUrls = [];

                        for (const image of images) {
                        let fileName = image.filename;
                        let imageUrl = `http://127.0.0.1:${port}/view?filename=${fileName}&type=output`;
                        imageUrls.push(imageUrl);
                        }

                        for (const imageUrl of imageUrls) {
                        const historyItem = document.createElement("md-card");
                        historyItem.className = 'ripple';
                        historyItem.innerHTML = `
                            <md-ripple></md-ripple>
                            <img src="${imageUrl}">
                        `;
                        historyItem.querySelector('img').addEventListener('click', () => {
                            openImageViewer(imageUrl);
                        });
                        const imageContainer = $("#app-core-image-viewer");
                        imageContainer.appendChild(historyItem);
                        }

                        // Scroll the image container to the bottom
                        loadHistory()

                        setTimeout(() => {
                        const imageContainer = $("#app-core-image-viewer");
                        imageContainer.style.scrollBehavior = 'smooth';
                        $('#app-core-image-viewer').scrollTop = 1200000000000000;

                        // Check the number of images and add/remove the 'only' class
                        const images = imageContainer.querySelectorAll('img');
                        const appViewer = $("#app-core-image-viewer");
                        if (images.length === 1) {
                            appViewer.classList.add('only');
                        } else {
                            appViewer.classList.remove('only');
                        }
                        }, 20)
                    })
                    .catch(err => {
                        console.error(err);
                        openDialog('error', '生成失败', '生成过程中发生错误。');
                    });
            
                    generateButton.textContent = "生成";
                    generateButton.disabled = false;

                }
                }
                
            }
            }
        }
        
    }

    installNode = (url, call) => {
        try {
            // 使用 exec 
            exec(`"${path.join(comfyUIPathPython, '.\\Git\\mingw64\\bin\\git.exe')}" clone ${url}`, {
                cwd: customNodesPath,
                stdio: 'inherit'  // 这会将输出显示在终端中
            });
    
            // 如果没有错误，返回 true
            call(true);
        } catch (error) {
            // 如果发生错误，捕获并返回 false
            console.error(`Error occurred: ${error.message}`);
            call(false);
        }
    };

    //git下载
    let gitSwitch = $("#git-switch");
    if (fs.existsSync(gitPath)) {
        gitSwitch.selected = true
        gitSwitch.disabled = true;
    } else {
        gitSwitch.selected = false
    }

    gitSwitch.onclick = () => {

        $("#git-switch").disabled = true;
        let xhr = new XMLHttpRequest();
        xhr.responseType = 'arraybuffer';

        // 配置请求
        xhr.open('GET', gitUrl, true);
    
        xhr.onprogress = (event) => {
            if (event.lengthComputable) {
                let totalLength = event.total;
                receivedBytes = event.loaded;
                
                $("#git-progress").style = `display: block`;
                
                // 计算进度
                let progress = (receivedBytes / totalLength) * 100;
                $("#git-progress").value  = progress;

                console.log(receivedBytes / totalLength);
            }
        };


        xhr.onload = async () => {
            if (xhr.status === 200) {
                const buffer = xhr.response; // 获取二进制数据
                console.log("File downloaded successfully.");
        
            try {   
        
                    // 目标文件夹
                    const extractDir = path.join(comfyUIPathPython);
        
                    // 确保目标文件夹存在
                    if (!fs.existsSync(extractDir)) {
                        fs.mkdirSync(extractDir, { recursive: true });
                    }
        
                    // 保存下载的文件
                    const downloadedFilePath = path.join(comfyUIPathPython, "Git.7z");
                    
                    fs.writeFileSync(downloadedFilePath, Buffer.from(buffer));

                    // 执行7z.exe命令，执行完删除../7z.exe文件
                    const command = `"${path.join(process.cwd(), './7z.exe')}" x "${downloadedFilePath}" -o"${extractDir}/Git" -y`;

                    child_process.exec(command, (error, stdout, stderr) => {
                        if (error) {
                            openDialog('error', '解压失败', `解压失败。`);
                            return;
                        }
        
                        console.log("Extraction complete.");
        
                        // 删除临时的下载文件
                        fs.unlinkSync(downloadedFilePath);
                        $("#git-progress").style = `display: none`;

                        
                    });
        
                } catch (err) {
                    console.error("Error during extraction:", err);
                    openDialog('error', '解压失败', `解压失败。`);
                }
            } else {
                openDialog('error', '下载失败', `下载失败，状态码: ${xhr.status}`);
            }
        };
        
        // 确保 xhr.responseType 设置为 arraybuffer
        xhr.responseType = "arraybuffer";
    
        xhr.onerror = () => {
            openDialog('error', '下载失败', '下载过程中发生错误。');
        };
    
        xhr.send(); // 发送请求

    }


    //https://github.com/ltdrdata/ComfyUI-Manager.git
    let comfyuiManagerSwitch = $("#comfyui-manager-switch");

    if (fs.existsSync(path.join(customNodesPath, './ComfyUI-Manager'))) {
        comfyuiManagerSwitch.selected = true
        comfyuiManagerSwitch.disabled = true;
    } else {
        comfyuiManagerSwitch.selected = false
    }

    comfyuiManagerSwitch.onclick = () => {
        installNode('https://github.com/ltdrdata/ComfyUI-Manager.git', (e) => {
            comfyuiManagerSwitch.selected = e;

            if(comfyuiManagerSwitch.selected = false) {
                openDialog('error', '下载失败', '下载 ComfyUI Manager 过程中发生错误。');
            } else {
                comfyuiManagerSwitch.disabled = true;
            }

        })
    }

    //https://github.com/ltdrdata/ComfyUI-Manager.git
    let comfyuiGgufSwitch = $("#comfyui-gguf-switch");

    if (fs.existsSync(path.join(customNodesPath, './ComfyUI-GGUF'))) {
        comfyuiGgufSwitch.selected = true
        comfyuiGgufSwitch.disabled = true;
    } else {
        comfyuiGgufSwitch.selected = false
    }

    comfyuiGgufSwitch.onclick = () => {
        installNode('https://github.com/city96/ComfyUI-GGUF', (e) => {
            comfyuiGgufSwitch.selected = e;

            if(comfyuiGgufSwitch.selected = false) {
                openDialog('error', '下载失败', '下载 ComfyUI Manager 过程中发生错误。');
            } else {
                comfyuiGgufSwitch.disabled = true;
            }

        })
    }

}

const openDialog = (icon, headline, content) => {
    const uuid = `dialog-${crypto.randomUUID()}`;
    const dialog = document.createElement('md-dialog');
    dialog.setAttribute('type', 'alert');
    dialog.setAttribute('id', uuid);
    dialog.innerHTML = `
        <div slot="headline"><md-icon>${icon}</md-icon>${headline}</div>
        <form slot="content" id="form-${uuid}" method="dialog">
            ${content}
        </form>
        <div slot="actions">
            <md-text-button form="form-${uuid}" value="ok">确定</md-text-button>
        </div>
    `;
    document.body.appendChild(dialog);
    dialog.show();
    dialog.addEventListener('close', () => {
        document.body.removeChild(dialog);
    });
};

const downloadModel = (files) => {
    const uuid = `dialog-${crypto.randomUUID()}`;
    const dialog_d = document.createElement('md-dialog');
    dialog_d.setAttribute('type', 'alert');
    dialog_d.setAttribute('id', uuid);
    dialog_d.innerHTML = `
        <div slot="headline"><md-icon>cloud_download</md-icon>下载中</div>
        <form slot="content" id="form-${uuid}" method="dialog">
            <div id="progress-container-${uuid}"></div>
        </form>
        <div slot="actions">
            <md-text-button form="form-${uuid}" value="cancel">取消</md-text-button>
        </div>
    `;
    document.body.appendChild(dialog_d);
    dialog_d.show();

    const progressContainer = dialog_d.querySelector(`#progress-container-${uuid}`);

    const updateDialogToComplete = () => {
        dialog_d.querySelector('div[slot="headline"]').innerHTML = '<md-icon>cloud_done</md-icon>已完成下载';
        dialog_d.querySelector('md-text-button').textContent = '完成';
    };

    let completedDownloads = 0;

    files.forEach(file => {
        const [folderPath, url] = file;
        const fileName = url.split('/').pop();
        const fullFolderPath = path.join(modelPath, folderPath);
        const filePath = path.join(fullFolderPath, fileName);

        const fileUuid = `progress-${crypto.randomUUID()}`;

        if (!fs.existsSync(fullFolderPath)) {
            fs.mkdirSync(fullFolderPath, { recursive: true });
        }

        if (fs.existsSync(filePath)) {
            return;
        }

        const progressItem = document.createElement('div');
        progressItem.className = 'progress-item';
        progressItem.innerHTML = `
            <p>${folderPath}/${fileName}</p>
            <md-linear-progress id="${fileUuid}" value="0" max="100"></md-linear-progress>
            <p id="${fileUuid}-text"></p>
        `;
        progressContainer.appendChild(progressItem);

        const progressBar = progressItem.querySelector(`#${fileUuid}`);
        const progressText = progressItem.querySelector(`#${fileUuid}-text`);

        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';

        xhr.onprogress = (event) => {
            if (event.lengthComputable) {
                const totalLength = event.total;
                const receivedBytes = event.loaded;
                const progress = (receivedBytes / totalLength) * 100;
                progressBar.value = progress;
                progressText.textContent = `${progress.toFixed()}% [${(receivedBytes / 1024 / 1024).toFixed()} MB / ${(totalLength / 1024 / 1024).toFixed()} MB]`;
            }
        };

        xhr.onload = () => {
            if (xhr.status === 200) {
                const buffer = xhr.response;

                fs.writeFile(filePath, Buffer.from(buffer), (err) => {
                    if (err) {
                        console.error(err);
                        openDialog('error', '下载失败', '保存文件时发生错误。');
                        return;
                    }

                    completedDownloads++;
                    if (completedDownloads === files.length) {
                        updateDialogToComplete();
                    }
                });
            } else {
                openDialog('error', '下载失败', `下载文件 ${fileName} 过程中发生错误。`);
            }
        };

        xhr.onerror = () => {
            openDialog('error', '下载失败', `文件 ${fileName} 下载过程中发生网络错误。`);
        };

        dialog_d.addEventListener('close', () => {
            if (dialog_d.returnValue === 'cancel') {
                xhr.abort();
            }
        });

        xhr.send();
    });
};

