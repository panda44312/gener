//载入node.js文件模块
const fs = require('fs');
const path = require('path');
const { ipcRenderer } = require('electron');
const { exec } = require('child_process');
const { execSync } = require('child_process');
const child_process = require('child_process');
const http = require('http');
const { console } = require('inspector');
const { dlopen } = require('process');

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

let port = getRandomPort() ;

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


    // //载入
    // window.addEventListener('DOMContentLoaded', () => {
        document.body.classList.add('on');
        
        //检测 ../ComfyUI文件夹是否存在，不存在就下载并解压
        const ComfyUIDir = path.join(userDataPath, './ComfyUI/ComfyUI_windows_portable/ComfyUI');

        //载入主题
        let themeColor = configManager.getConfig('themeColor', '#2196f3');
        console.log(`Theme color: ${themeColor}`);
        const themeColorInput = $("#theme-color-input");
        themeColorInput.value = themeColor;
        
        mdui.setColorScheme(`${themeColor}`);


        themeColorInput.oninput = () => {
            configManager.updateConfig('themeColor', themeColorInput.value);
            mdui.setColorScheme(`${themeColorInput.value}`);
        }

        if (!fs.existsSync(ComfyUIDir)) {
            getComfyUIDir();
        } else {
            console.log('ComfyUI 已存在，直接跳过下载和解压过程。');

            let resizer = $('.container-main #resizer');
            let leftPanel = $('.container-main #app-core-image-generator');

            // 标志是否正在拖动
            let isResizing = false;
    
            // 记录鼠标按下时的初始位置与左侧面板的初始宽度
            let startX, startWidth;
    
            resizer.addEventListener('mousedown', function(e) {
            isResizing = true;
            startX = e.clientX;                           // 记录鼠标按下时的X坐标
            startWidth = leftPanel.getBoundingClientRect().width; // 记录左侧面板的当前宽度
            
            // 禁止文本选择
            document.body.style.userSelect = 'none';
            });
    
            // 鼠标移动时计算偏移量，并调整宽度
            document.addEventListener('mousemove', function(e) {
                if (!isResizing) return;
                
                // 计算鼠标移动的偏移量
                const offset = e.clientX - startX - 20;
                
                // 根据初始宽度加上偏移量计算新的宽度
                let newWidth = startWidth + offset;
                
                // 限制宽度范围（根据需要调整最小、最大值）
                if (newWidth < 200) newWidth = 200;
                if (newWidth > 800) newWidth = 800;
                
                leftPanel.style.minWidth = newWidth + 'px';
            });
    
            // 鼠标释放时停止拖动
            document.addEventListener('mouseup', function() {
                isResizing = false;
                document.body.style.userSelect = 'auto';
            });    

            //载入主页面
             loadApp();
        }
    // });
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

    const generateButton = $("#app-core-image-generator #generate-button");

    const Setrat = async () => {

        // exec('taskkill /f /im python.exe');
        // // 人为等待一段时间
        // const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
        // await delay(20);
        // console.log("等待结束，继续执行...");
    
        exec('wmic path win32_VideoController get name', (err, stdout, stderr) => {
            if (err) {
                openDialog('error', '显卡检测失败', '显卡检测过程中发生错误。');
                return;
            }
            if (stdout.includes("NVIDIA")) {
                console.log("NVIDIA 显卡检测通过。");
                const command = `"python_embeded\\python.exe" -s ComfyUI\\main.py --fast --port ${port}`;
                comfyUIProcess = exec(command, {
                    cwd: comfyUIPathPython
                });
    
                comfyUIProcess.stderr.on('data', (data) => {
                    console.log(`${data}`);
                    terminal(data);
    
                    if ($("#comfy-ui-load").value != 1)
                        $("#comfy-ui-load").value = $("#comfy-ui-load").value + 0.05;
    
                    if (data.includes(`To see the GUI go to: http://127.0.0.1:${port}`)) {
                        $(".container-comfyui-web").src = `http://127.0.0.1:${port}`;
                        $("#comfy-ui-load").value = 1;
                        generateButton.disabled = false;
                        loadAppMain();
                    }
                });
    
                comfyUIProcess.on('close', (code) => {
                    if (code !== 0) {
                        openDialog('error', '启动失败', `ComfyUI 进程异常退出。`);
                    } else {
                        console.log("ComfyUI started successfully with NVIDIA GPU.");
                    }
                });
            } else {
                openDialog('error', '显卡检测失败', '检测到您的电脑没有 NVIDIA 显卡， 无法继续运行。');
                console.log("No NVIDIA GPU detected. Starting with CPU...");
            }
        });
    };
    
    // 当 Electron 渲染进程页面刷新或关闭时，终止子进程
    window.addEventListener('beforeunload', () => {
        if (comfyUIProcess && !comfyUIProcess.killed) {
            console.log("页面刷新或关闭，正在终止子进程...");
            // 发送 SIGTERM 信号结束子进程，或根据需要使用 'SIGKILL'
            comfyUIProcess.kill('SIGTERM');
        }
    });
    
    Setrat()


    loadHistory = () => {
        const historyList = $(".container-history #history-list");
        historyList.innerHTML = ``;
    
        // fs获取 historyPath 中的文件，然后显示在 historyList 中
        fs.readdir(historyPath, (err, files) => {
            if (err) {
                console.error(err);
                return;
            }
            // 倒序排列文件列表
            const filesToLoad = files.reverse();
            let currentIndex = 0;
            const batchSize = 10; // 每次载入的条数
            let isLoading = false;
    
            // 分批载入函数
            const loadNextBatch = () => {
                if (isLoading) return;
                isLoading = true;
    
                let count = 0;
                const batchPromises = []; // 用于等待本批次所有图片加载完成
                const batchCards = [];    // 记录本批次所有卡片元素
    
                while (currentIndex < filesToLoad.length && count < batchSize) {
                    const file = filesToLoad[currentIndex];
                    currentIndex++;
                    if (file.endsWith('.png')) {
                        // 创建 md-card 元素
                        const historyItem = document.createElement("mdui-card");
                        historyItem.className = 'ripple';
                        // 初始隐藏整个卡片，使用透明度动画
                        historyItem.style.opacity = '0';
                        historyItem.style.transition = 'opacity 0.2s ease-in-out';
                        const uuid = generateUUID();
                        historyItem.innerHTML = `
                            <mdui-checkbox id="${uuid}"></mdui-checkbox>
                            <mdui-ripple></mdui-ripple>
                            <img src="http://127.0.0.1:${port}/view?filename=${file}&type=output">
                        `;
                        
                        // 保存卡片用于后续动画
                        batchCards.push(historyItem);
    
                        // 获取图片对象，并等待图片加载完成
                        const img = historyItem.querySelector('img');
                        const loadPromise = new Promise(resolve => {
                            if (img.complete) {
                                resolve();
                            } else {
                                img.addEventListener('load', resolve);
                                img.addEventListener('error', resolve);
                            }
                        });
                        batchPromises.push(loadPromise);
    
                        // 点击图片打开查看器
                        img.addEventListener('click', () => {
                            openImageViewer(`http://127.0.0.1:${port}/view?filename=${file}&type=output`);
                        });
    
                        // 为 checkbox 添加 change 事件
                        historyItem.querySelector('mdui-checkbox').addEventListener('change', updateSelectAllCheckboxState);
    
                        // 添加到历史列表
                        historyList.appendChild(historyItem);
                        count++;
                    }
                }
    
                // 等待本批次所有图片加载完成后，再调用瀑布流布局，并淡入显示卡片
                Promise.all(batchPromises).then(() => {
                    waterfall($("#history-list"));
                    batchCards.forEach(card => {
                        card.style.opacity = '1';
                    });
                    isLoading = false;
                });
            };
    
            // 初始载入第一批
            loadNextBatch();
    
            // 监听滚动，滚动到底部时载入下一批
            historyList.parentElement.addEventListener('scroll', () => {
                const container = historyList.parentElement;
                if (container.scrollTop + container.clientHeight >= container.scrollHeight - 50) {
                    if (currentIndex < filesToLoad.length) {
                        loadNextBatch();
                    }
                }
            });
    
            // Add floating menu
            const floatingMenu = $(`.container-history-floating-menu`);
            const selectAllCheckbox = floatingMenu.querySelector('#select-all');
            const deleteSelectedButton = floatingMenu.querySelector('#delete-selected');
    
            selectAllCheckbox.addEventListener('change', () => {
                const isChecked = selectAllCheckbox.checked;
                historyList.querySelectorAll('mdui-checkbox').forEach(checkbox => {
                    checkbox.checked = isChecked;
                });
                updateSelectAllCheckboxState();
            });
    
            deleteSelectedButton.addEventListener('click', () => {
                const selectedFiles = [];
                historyList.querySelectorAll('mdui-checkbox').forEach(checkbox => {
                    if (checkbox.checked) {
                        const file = checkbox.closest('mdui-card')
                            .querySelector('img').src.split('filename=')[1].split('&')[0];
                        selectedFiles.push(file);
                    }
                });
                selectedFiles.forEach(file => {
                    deleteHistoryItem([file]);
                });
            });
    
            window.addEventListener('resize', function () {
                waterfall($("#history-list"));
            });
    
            setInterval(() => {
                waterfall($("#history-list"));
            }, 1000);
        });
    
        generateUUID = () => {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0,
                      v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        };
    
        deleteHistoryItem = (files) => {
            try {
                files.forEach(file => {
                    fs.unlinkSync(path.join(historyPath, file));
                    const historyItem = Array.from(historyList.children)
                        .find(item => item.querySelector('img').src.includes(file));
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
            const checkboxes = historyList.querySelectorAll('mdui-checkbox');
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
                    const modelItem = document.createElement("mdui-list-item");
                    modelItem.innerHTML = `
                        <mdui-icon selected slot="icon">deployed_code</mdui-icon>
                        <span>${file}</span>
                        <mdui-button-icon slot="end-icon" icon="delete" onclick="deleteModel('${modelPathE.value}', '${file}')"></mdui-button-icon>
                    `;
                    modelItem.	rounded = true
                    modelList.appendChild(modelItem);
                    const modelOption = `
                        <mdui-menu-item value="${file}" icon="deployed_code">
                            ${file.split('.')[0]}
                        </mdui-menu-item>
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
                const dialog = document.createElement('mdui-dialog');
                dialog.icon = "delete"
                dialog.innerHTML = `
                    <div slot="headline">确认删除</div>
                    您确定要删除模型 “${file}” 吗？
                `;

                const btn1 = document.createElement('mdui-button');
                btn1.textContent = '取消';
                
                btn1.addEventListener('click', () => {
                    dialog.open = false;
                    document.body.removeChild(dialog);
                })

                dialog.appendChild(btn1);

                const btn2 = document.createElement('mdui-button');
                btn2.textContent = '删除';

                btn2.addEventListener('click', () => {
                    dialog.open = false;
                    
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

                    document.body.removeChild(dialog);
                })

                dialog.appendChild(btn2);

                document.body.appendChild(dialog);
            
                dialog.addEventListener('close', () => {
                    document.body.removeChild(dialog);
                });
            
                dialog.open = true;
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
                <div class="image-viewer-content" class="mdui-theme-dark">
                    <img src="${imageUrl}" alt="Image Viewer">
                    <mdui-button-icon class="image-viewer-download" icon="download" variant="text" class="mdui-theme-dark"></mdui-button-icon>
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
        // const imageLoadBtn = $("#app-core-image-generator #image-load-btn");
        
        // imageLoadBtn.onclick = () => {
        //     const fileInput = document.createElement('input');
        //     fileInput.type = 'file';
        //     fileInput.accept = 'image/*';
        //     fileInput.multiple = true;
    
        //     fileInput.onchange = (event) => {
        //         const files = event.target.files;
        //         for (const file of files) {
        //             const reader = new FileReader();
        //             reader.onload = (e) => {
        //                 const img = document.createElement('img');
        //                 img.src = e.target.result;
        //                 img.classList.add('uploaded-image');
        //                 $("#app-core-image-viewer").appendChild(img);
        //             };
        //             reader.readAsDataURL(file);
        //         }
        //     };

        //     fileInput.click();
        // }

        generateButton.onclick = () => {

            //获取完整数据
            const modelSelect = $("#app-core-image-generator #model-select");
            const textField = $("#app-core-image-generator #prompt");
            const textField2 = $("#app-core-image-generator #prompt2");

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
            let prompt2 = textField2.value;

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
                        "clip": ["30", 1]
                    },
                    "class_type": "CLIPTextEncode",
                    "_meta": { "title": "提示词" }
                },
                "8": {
                    "inputs": {
                        "samples": ["31", 0],
                        "vae": ["30", 2]
                    },
                    "class_type": "VAEDecode",
                    "_meta": { "title": "VAE解码" }
                },
                "9": {
                    "inputs": {
                        "filename_prefix": "ComfyUI",
                        "images": ["8", 0]
                    },
                    "class_type": "SaveImage",
                    "_meta": { "title": "保存图像" }
                },
                "27": {
                    "inputs": {
                        "width": sizeValue[0],
                        "height": sizeValue[1],
                        "batch_size": batchSizeValue
                    },
                    "class_type": "EmptySD3LatentImage",
                    "_meta": { "title": "创建一个画布" }
                },
                "30": {
                    "inputs": {
                        "ckpt_name": model
                    },
                    "class_type": "CheckpointLoaderSimple",
                    "_meta": { "title": "载入模型" }
                },
                "31": {
                    "inputs": {
                        "seed": Math.floor(Math.random() * Math.pow(2, 64)),
                        "steps": stepsValue,
                        "cfg": model.includes('flux') ? 1 : 8,
                        "sampler_name": "euler",
                        "scheduler": model.includes('flux') ? "simple" : "normal",
                        "denoise": 1,
                        "model": ["30", 0],
                        "positive": ["6", 0],
                        "negative": ["33", 0],
                        "latent_image": ["27", 0]
                    },
                    "class_type": "KSampler",
                    "_meta": { "title": "生成" }
                },
                "33": {
                    "inputs": {
                        "text": prompt2,
                        "clip": ["30", 1]
                    },
                    "class_type": "CLIPTextEncode",
                    "_meta": { "title": "负面提示*" }
                }
            }
            

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
        gitSwitch.checked = true
        gitSwitch.disabled = true;
    } else {
        gitSwitch.checked = false
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
        comfyuiManagerSwitch.checked = true
        comfyuiManagerSwitch.disabled = true;
    } else {
        comfyuiManagerSwitch.checked = false
    }

    comfyuiManagerSwitch.onclick = () => {
        installNode('https://github.com/ltdrdata/ComfyUI-Manager.git', (e) => {
            comfyuiManagerSwitch.checked = e;

            if(comfyuiManagerSwitch.checked = false) {
                openDialog('error', '下载失败', '下载 ComfyUI Manager 过程中发生错误。');
            } else {
                comfyuiManagerSwitch.disabled = true;
            }

        })
    }

    //https://github.com/ltdrdata/ComfyUI-Manager.git
    let comfyuiGgufSwitch = $("#comfyui-gguf-switch");

    if (fs.existsSync(path.join(customNodesPath, './ComfyUI-GGUF'))) {
        comfyuiGgufSwitch.checked = true
        comfyuiGgufSwitch.disabled = true;
    } else {
        comfyuiGgufSwitch.checked = false
    }

    comfyuiGgufSwitch.onclick = () => {
        installNode('https://github.com/city96/ComfyUI-GGUF', (e) => {
            comfyuiGgufSwitch.checked = e;

            if(comfyuiGgufSwitch.checked = false) {
                openDialog('error', '下载失败', '下载 ComfyUI Manager 过程中发生错误。');
            } else {
                comfyuiGgufSwitch.disabled = true;
            }

        })
    }

}

const openDialog = (icon, headline, content) => {
    const uuid = `dialog-${crypto.randomUUID()}`;
    const dialog = document.createElement('mdui-dialog');
    dialog.setAttribute('class', uuid);
    dialog.icon = icon;

    dialog.innerHTML = `
        <div slot="headline">
            ${headline}
        </div>
        ${content}
        <mdui-button slot="action" variant="tonal" id="confirm-${uuid}">确定</mdui-button>
    `;
    
    dialog.closeOnOverlayClick = false;

    document.body.appendChild(dialog);
    dialog.open = true;

    dialog.querySelector(`#confirm-${uuid}`).addEventListener('click', () => {
        dialog.open = false;
        document.body.removeChild(dialog);
    });

    dialog.addEventListener('close', () => {
        document.body.removeChild(dialog);
    });
};

const downloadModel = (files) => {
    const uuid = `dialog-${crypto.randomUUID()}`;
    const dialog_d = document.createElement('mdui-dialog');
    dialog_d.setAttribute('id', uuid);
    dialog_d.icon = "cloud_download";
    dialog_d.innerHTML = `
        <div slot="headline">下载中</div>
        <div id="progress-container-${uuid}"></div>
        <mdui-button slot="action" variant="text" id="cancel-${uuid}">取消</mdui-button>
        <mdui-button slot="action" variant="tonal" id="done-${uuid}" style="display: none;">完成</mdui-button>
    `;

    document.body.appendChild(dialog_d);
    dialog_d.open = true;
    dialog_d.closeOnOverlayClick = false;

    const progressContainer = dialog_d.querySelector(`#progress-container-${uuid}`);
    const cancelButton = dialog_d.querySelector(`#cancel-${uuid}`);
    const doneButton = dialog_d.querySelector(`#done-${uuid}`);

    let completedDownloads = 0;

    const updateDialogToComplete = () => {
        dialog_d.querySelector('div[slot="headline"]').innerHTML = '<mdui-icon>cloud_done</mdui-icon> 已完成下载';
        cancelButton.style.display = 'none';
        doneButton.style.display = 'inline-block';
    };

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
            <mdui-linear-progress id="${fileUuid}" value="0" max="100"></mdui-linear-progress>
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
                const progress = (event.loaded / event.total) * 100;
                progressBar.value = progress;
                progressText.textContent = `${progress.toFixed()}% [${(event.loaded / 1024 / 1024).toFixed(2)} MB / ${(event.total / 1024 / 1024).toFixed(2)} MB]`;
            }
        };

        xhr.onload = () => {
            if (xhr.status === 200) {
                const buffer = Buffer.from(xhr.response);

                fs.writeFile(filePath, buffer, (err) => {
                    if (err) {
                        console.error(err);
                        progressText.textContent = '❌ 保存失败';
                        return;
                    }

                    completedDownloads++;
                    progressText.textContent += ' ✅';

                    if (completedDownloads === files.length) {
                        updateDialogToComplete();
                    }
                });
            } else {
                progressText.textContent = '❌ 下载失败';
            }
        };

        xhr.onerror = () => {
            progressText.textContent = '❌ 网络错误';
        };

        cancelButton.addEventListener('click', () => {
            xhr.abort();
            document.body.removeChild(dialog_d);
        });

        doneButton.addEventListener('click', () => {
            document.body.removeChild(dialog_d);
        });

        xhr.send();
    });
};


