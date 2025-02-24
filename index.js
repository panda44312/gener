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
const sevenBin = require('7zip-bin'); // 引入7zip-bin模块

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
const gitUrl      = 'https://github.com/git-for-windows/git/releases/download/v2.48.0-rc2.windows.1/PortableGit-2.48.0-rc2-64-bit.7z.exe';
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
        
            // try {   
        
            //         // 目标文件夹
            //         const extractDir = userDataPath;
        
            //         // 确保目标文件夹存在
            //         if (!fs.existsSync(extractDir)) {
            //             fs.mkdirSync(extractDir, { recursive: true });
            //         }
        
            //         // 保存下载的文件
            //         const downloadedFilePath = path.join(extractDir, "ComfyUI.7z");
                    
            //         fs.writeFileSync(downloadedFilePath, Buffer.from(buffer));
        
            //         console.log("File saved for extraction.");
            //         switchPage("page-welcome-complete");
                    
            //         // 执行7z.exe命令，执行完删除../7z.exe文件
            //         const command = `"${path.join(process.cwd(), './7z.exe')}" x "${downloadedFilePath}" -o"${extractDir}/ComfyUI" -y`;

            //         child_process.exec(command, (error, stdout, stderr) => {
            //             if (error) {
            //                 openDialog('error', '解压失败', `解压失败。`);
            //                 switchPage("page-welcome");
            //                 return;
            //             }
        
            //             console.log("Extraction complete.");
            //             $(".page-welcome-complete #next_text").textContent = "已经成功下载了 ComfyUI ，已完成解压。"
            //             $(".page-welcome-complete #next").disabled = false;
            //             $(".page-welcome-complete #progress-bar").indeterminate = false;
            //             $(".page-welcome-complete #progress-bar").value = 100;
            //             $(".page-welcome-complete #next").onclick = () => {
            //                 loadApp();
            //             }
        
            //             // 删除临时的下载文件
            //             fs.unlinkSync(downloadedFilePath);
                        
            //         });
        
            //     } catch (err) {
            //         console.error("Error during extraction:", err);
            //         openDialog('error', '解压失败', `解压失败。`);
            //         switchPage("page-welcome");
            //     }

                try {   
                    // const fs = require('fs');
                    // const path = require('path');
                    // const child_process = require('child_process');
                
                    // 目标文件夹（假设 userDataPath 已定义）
                    const extractDir = userDataPath;
                
                    // 确保目标文件夹存在
                    if (!fs.existsSync(extractDir)) {
                        fs.mkdirSync(extractDir, { recursive: true });
                    }
                
                    // 保存下载的文件（buffer 为已下载的数据）
                    const downloadedFilePath = path.join(extractDir, "ComfyUI.7z");
                    fs.writeFileSync(downloadedFilePath, Buffer.from(buffer));
                    console.log("文件已保存，用于解压：", downloadedFilePath);
                
                    // 切换页面到“完成”页面（注意：此时 UI 可能还显示等待状态，待解压完成后再更新按钮状态）
                    switchPage("page-welcome-complete");
                
                    // 设定解压输出目录（将解压到 extractDir/ComfyUI 下）
                    const outputDir = path.join(extractDir, "ComfyUI");
                    // 构造命令，使用7zip-bin提供的 7za 路径
                    const command = `"${sevenBin.path7za}" x "${downloadedFilePath}" -o"${outputDir}" -y`;
                
                    console.log("执行解压命令：", command);
                
                    child_process.exec(command, (error, stdout, stderr) => {
                        if (error) {
                            console.error("解压过程中出错：", error);
                            openDialog('error', '解压失败', `解压失败。`);
                            switchPage("page-welcome");
                
                            // 出错时删除临时下载的文件（如果存在）
                            if (fs.existsSync(downloadedFilePath)) {
                                fs.unlinkSync(downloadedFilePath);
                                console.log("已删除临时文件：", downloadedFilePath);
                            }
                            return;
                        }
                
                        console.log("解压完成。");
                        if (stdout) {
                            console.log("stdout:", stdout);
                        }
                        if (stderr) {
                            console.error("stderr:", stderr);
                        }
                
                        // 更新页面上的状态信息
                        const nextTextEl = document.querySelector(".page-welcome-complete #next_text");
                        const nextButtonEl = document.querySelector(".page-welcome-complete #next");
                        const progressBarEl = document.querySelector(".page-welcome-complete #progress-bar");
                
                        if (nextTextEl) {
                            nextTextEl.textContent = "已经成功下载了 ComfyUI ，已完成解压。";
                        }
                        if (nextButtonEl) {
                            nextButtonEl.disabled = false;
                            nextButtonEl.onclick = () => {
                                loadApp();
                            };
                        }
                        if (progressBarEl) {
                            progressBarEl.indeterminate = false;
                            progressBarEl.value = 100;
                        }
                
                        // 解压完成后删除临时下载的7z文件
                        if (fs.existsSync(downloadedFilePath)) {
                            fs.unlinkSync(downloadedFilePath);
                            console.log("已删除临时文件：", downloadedFilePath);
                        }
                    });
                
                } catch (err) {
                    console.error("解压过程中捕获到错误:", err);
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

const loadApp = () => {

    switchPage("page-main"); // 直接切换到主页面
    switchContainer("#home-button", "container-main"); // 切换到ComfyUI页面

    const generateButton = $("#app-core-image-generator #generate-button");

    const Setrat = async () => {

        exec('taskkill /f /im python.exe');
        // 人为等待一段时间
        const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
        await delay(20);
        console.log("等待结束，继续执行...");
    
        $("#comfy-ui-load").value = 0;
        exec('wmic path win32_VideoController get name', (err, stdout, stderr) => {
            if (err) {
                openDialog('error', '显卡检测失败', '显卡检测过程中发生错误。');
                return;
            }
            if (stdout.includes("NVIDIA")) {
                console.log("NVIDIA 显卡检测通过。");
                const command = `"python_embeded\\python.exe" -s ComfyUI\\main.py --fast --port ${port}`;
                comfyUIProcess = exec(command, {
                    cwd: comfyUIPathPython,
                    stdio: 'inherit'
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
                    }
                });

                window.addEventListener('beforeunload', () => {
                    if (comfyUIProcess) {
                      comfyUIProcess.kill();
                      spawn('taskkill', ['/PID', comfyUIProcess.pid.toString(), '/T', '/F'], { shell: true });
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
                            <!-- <img src="http://127.0.0.1:${port}/view?filename=${file}&type=output"> -->
                            <img src="file:///${path.join(historyPath, file)}">
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
                            // openImageViewer(`http://127.0.0.1:${port}/view?filename=${file}&type=output`);
                            openImageViewer(`file:///${path.join(historyPath, file)}`);
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
                    // waterfall($("#history-list"));
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
                        const file = checkbox.closest('mdui-card').querySelector('img').src.split('filename=')[1].split('&')[0];
                        selectedFiles.push(file);
                    }
                });
                selectedFiles.forEach(file => {
                    deleteHistoryItem([file]);
                });
            });
    
            window.addEventListener('resize', function () {
                // waterfall($("#history-list"));
            });
    
            // setInterval(() => {
            //     waterfall($("#history-list"));
            // }, 1000);
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

        // 假设 fs、path、child_process 已经 require 进来了
        // const fs = require('fs');
        // const path = require('path');
        // const { exec } = require('child_process');

        // 更新模型列表：使用 MDUI tabs 展示 modelPath 目录下的所有内容
        const updateModelList = () => {
            // 获取容器（请确保页面中有 <div id="model-list"></div>）
            const modelList = document.getElementById('model-list');
            modelList.innerHTML = '';

            // 读取 modelPath 目录下的所有文件/文件夹
            fs.readdir(modelPath, (err, items) => {
                if (err) {
                    console.error('读取 modelPath 失败：', err);
                    return;
                }

                // 将根目录下的内容分为文件和文件夹两组
                const folders = [];
                const files = [];
                items.forEach(item => {
                    const fullPath = path.join(modelPath, item);
                    try {
                        const stat = fs.statSync(fullPath);
                        if (stat.isDirectory()) {
                            folders.push(item);
                        } else {
                            files.push(item);
                        }
                    } catch (e) {
                        console.error('获取状态出错：', e);
                    }
                });

                // 构造 mdui-tabs 的 HTML 结构
                // 示例结构：
                // <mdui-tabs value="tab-0">
                //   <mdui-tab value="tab-0">Files</mdui-tab>
                //   <mdui-tab value="tab-1">Folder1</mdui-tab>
                //   ...
                //
                //   <mdui-tab-panel slot="panel" value="tab-0">…</mdui-tab-panel>
                //   <mdui-tab-panel slot="panel" value="tab-1">…</mdui-tab-panel>
                //   ...
                // </mdui-tabs>
                let tabHeadersHtml = '';
                let tabPanelsHtml = '';
                let tabIndex = 0;

                // 如果根目录中存在文件，则增加一个 Tab 显示这些文件
                if (files.length > 0) {
                    const tabValue = `tab-${tabIndex}`;
                    tabHeadersHtml += `<mdui-tab value="${tabValue}">Files</mdui-tab>`;

                    let filesHtml = `<mdui-list>`;
                    files.forEach(file => {
                        filesHtml += `
            <mdui-list-item rounded>
              <mdui-icon slot="icon">insert_drive_file</mdui-icon>
              <span>${file}</span>
              <mdui-button-icon slot="end-icon" icon="delete" onclick="deleteModel('${modelPath.replaceAll('\\', '\\\\')}', '${file}')"></mdui-button-icon>
            </mdui-list-item>
          `;
                    });
                    filesHtml += `</mdui-list>`;
                    tabPanelsHtml += `<mdui-tab-panel slot="panel" value="${tabValue}">${filesHtml}</mdui-tab-panel>`;
                    tabIndex++;
                }

                // 对于每个文件夹，在 Tab 中显示文件夹名称，Tab 面板中列出该文件夹下的所有内容
                folders.forEach(folder => {
                    const tabValue = `tab-${tabIndex}`;
                    tabHeadersHtml += `<mdui-tab value="${tabValue}">${folder}</mdui-tab>`;

                    const folderPath = path.join(modelPath, folder);
                    let folderItems = [];
                    try {
                        folderItems = fs.readdirSync(folderPath);
                    } catch (e) {
                        console.error(`读取文件夹 ${folder} 失败:`, e);
                    }

                    let folderHtml = `<mdui-list>`;
                    folderItems.forEach(item => {
                        const itemFullPath = path.join(folderPath, item);
                        // 判断图标：文件显示文件图标，文件夹显示文件夹图标
                        let iconName = 'insert_drive_file';
                        try {
                            const stat = fs.statSync(itemFullPath);
                            if (stat.isDirectory()) {
                                iconName = 'folder';
                            }
                        } catch (e) {
                            console.error(e);
                        }
                        folderHtml += `
            <mdui-list-item rounded>
              <mdui-icon slot="icon">${iconName}</mdui-icon>
              <span>${item}</span>
              <mdui-button-icon slot="end-icon" icon="delete" onclick="deleteModel('${folderPath.replaceAll('\\', '\\\\')}', '${item}')"></mdui-button-icon>
            </mdui-list-item>
          `;
                    });
                    folderHtml += `</mdui-list>`;
                    tabPanelsHtml += `<mdui-tab-panel slot="panel" value="${tabValue}">${folderHtml}</mdui-tab-panel>`;
                    tabIndex++;
                });

                // 拼接最终的 mdui-tabs 结构
                const tabsHtml = `
        <mdui-tabs value="tab-0" full-width>
          ${tabHeadersHtml}
          ${tabPanelsHtml}
        </mdui-tabs>
      `;

                modelList.innerHTML = tabsHtml;
            });
        };

        // 删除文件或文件夹内的文件（删除操作基于传入的文件夹和文件名）
        deleteModel = (folder, file) => {
            const fullPath = path.join(folder.replaceAll('\\', '\\\\'), file);
            console.log(fullPath)
            const dialog = document.createElement('mdui-dialog');
            dialog.icon = "delete";
            dialog.innerHTML = `
      <div slot="headline">确认删除</div>
      您确定要删除 “${file}” 吗？
    `;

            // 取消按钮
            const cancelBtn = document.createElement('mdui-button');
            cancelBtn.textContent = '取消';
            cancelBtn.slot="action"
            cancelBtn.addEventListener('click', () => {
                dialog.open = false;
                document.body.removeChild(dialog);
            });
            dialog.appendChild(cancelBtn);

            // 删除按钮
            const deleteBtn = document.createElement('mdui-button');
            deleteBtn.textContent = '删除';
            deleteBtn.slot="action"
            deleteBtn.addEventListener('click', () => {
                // 调用 fs.unlink 删除文件，如果要删除文件夹，请根据需要改用 fs.rmdir 或 fs.rm（递归删除）
                fs.unlink(fullPath, (err) => {
                    if (err) {
                        openDialog('error', '删除失败', '删除过程中发生错误。');
                    } else {
                        // 删除成功后刷新列表
                        updateModelList();
                    }
                });
                dialog.open = false;
                document.body.removeChild(dialog);
            });
            dialog.appendChild(deleteBtn);

            document.body.appendChild(dialog);
            // 确保对话框关闭后回收 DOM
            dialog.addEventListener('close', () => {
                if (document.body.contains(dialog)) {
                    document.body.removeChild(dialog);
                }
            });
            dialog.open = true;
        };

        const modelSelect = $("#app-core-image-generator #model-select");
        modelSelect.innerHTML = ``;

        modelPathE = path.join(modelPath, './checkpoints/');

        fs.readdir(modelPathE, (err, files) => {
            if (err) {
                console.error(err);
                return;
            }
            files.forEach(file => {
                if (file !== 'put_checkpoints_here') {
                    const modelOption = `
                        <mdui-menu-item value="${file}" icon="deployed_code">
                            ${file}
                        </mdui-menu-item>
                    `;
                    modelSelect.insertAdjacentHTML('beforeend', modelOption);
                }
            });

        });




        // const modelPathFaaa = $("#app-core-image-generator #model-path");
        // modelPathFaaa.value = modelPath;

        // 打开文件资源管理器，定位到 modelPath 目录
        const modelPathButton = document.querySelector(".container-model #model-path-button");
        modelPathButton.onclick = () => {
            const command = 'explorer.exe ' + modelPath;
            exec(command, (err) => {
                if (err) {
                    console.error('打开资源管理器失败:', err);
                }
            });
        };

        // 调用 updateModelList() 刷新列表
        updateModelList();
  

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

        loadData = () => {

            // 获取页面上的控件

            // 基本
            const modelSelect = $("#app-core-image-generator #model-select");
            const textField   = $("#app-core-image-generator #prompt");
            const sizeSelect  = $("#app-core-image-generator #size-select");
            const steps       = $("#app-core-image-generator #setps-slider");
            const batchSize   = $("#app-core-image-generator #batch-size");
            const batchSizeA  = $("#batch-size-a");

            // 高级
            const advancedCheckbox = $("#app-core-image-generator #advanced-checkbox");
            const textField2  = $("#app-core-image-generator #prompt2");
            const cfgScaleSelect = $("#app-core-image-generator #cfg-scale-select");
            const samplerSelect = $("#app-core-image-generator #sampler-select");
            const schedulerSelect = $("#app-core-image-generator #scheduler-select");
            const randomValue = $("#app-core-image-generator #random-value");
            const noiseSlider = $("#app-core-image-generator #noise-slider");


                // 载入保存的配置，并为每个控件赋值（如果配置不存在则使用默认值）
                modelSelect.value = configManager.getConfig('model', '')
                textField.value = configManager.getConfig('prompt', '')
                textField2.value = configManager.getConfig('prompt2', '')
                sizeSelect.value = configManager.getConfig('size', '1024x1024')
                steps.value = configManager.getConfig('steps', 15)
                batchSize.value = configManager.getConfig('batchSize', 1)
                batchSizeA.value = configManager.getConfig('batchSizeA', 1);
                advancedCheckbox.checked = configManager.getConfig('advanced', false);
                samplerSelect.value = configManager.getConfig('sampler', 'euler');
                schedulerSelect.value = configManager.getConfig('scheduler', 'normal');
                randomValue.value = configManager.getConfig('randomValue', 0);
                cfgScaleSelect.value = configManager.getConfig('cfgScale', 8.0);
                noiseSlider.value = configManager.getConfig('noise', 1.0);

            setTimeout(() => {
                // 当页面中任意 input 或 select 控件的值发生变化时，调用保存函数
                $("#app-core-image-generator").addEventListener("change", saveSettings);
            }, 30);

            // 定义一个保存当前设置的函数
            function saveSettings() {
                configManager.updateConfig('model', modelSelect.value);
                configManager.updateConfig('prompt', textField.value);
                configManager.updateConfig('prompt2', textField2.value);
                configManager.updateConfig('size', sizeSelect.value);
                configManager.updateConfig('steps', steps.value);
                configManager.updateConfig('batchSize', batchSize.value);
                configManager.updateConfig('batchSizeA', batchSizeA.value);
                configManager.updateConfig('advanced', advancedCheckbox.checked);
                configManager.updateConfig('sampler', samplerSelect.value);
                configManager.updateConfig('scheduler', schedulerSelect.value);
                configManager.updateConfig('randomValue', randomValue.value);
                configManager.updateConfig('cfgScale', cfgScaleSelect.value);
                configManager.updateConfig('noise', noiseSlider.value);
                console.log("设置已保存");
            }
        }

        loadData();
        
        generateButton.onclick = () => {


            // 基本
            const modelSelect = $("#app-core-image-generator #model-select");
            const textField   = $("#app-core-image-generator #prompt");
            const sizeSelect  = $("#app-core-image-generator #size-select");
            const steps       = $("#app-core-image-generator #setps-slider");
            const batchSize   = $("#app-core-image-generator #batch-size");
            const batchSizeA  = $("#batch-size-a");

            // 高级
            const advancedCheckbox = $("#app-core-image-generator #advanced-checkbox");
            const textField2  = $("#app-core-image-generator #prompt2");
            const cfgScaleSelect = $("#app-core-image-generator #cfg-scale-select");
            const samplerSelect = $("#app-core-image-generator #sampler-select");
            const schedulerSelect = $("#app-core-image-generator #scheduler-select");
            const randomValue = $("#app-core-image-generator #random-value");
            const noiseSlider = $("#app-core-image-generator #noise-slider");


            if(batchSize.value === '0') {
                batchSize.value = 1;
            }

            if (steps.value === '0') {
                steps.value = 1;
            }


            if (modelSelect.value === '') {
                openDialog('error', '生成失败', '请选择一个模型。');
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
                        // 函数判断
                        "seed": (function() {
                            if (advancedCheckbox.checked) {
                                if(randomValue.value !== 0) {
                                    return randomValue.value;
                                } else {
                                    return Math.floor(Math.random() * Math.pow(2, 64));
                                }
                            } else {
                                return Math.floor(Math.random() * Math.pow(2, 64));
                            }
                        })(),
                        "steps": stepsValue,
                        "cfg": (function() {
                            if (advancedCheckbox.checked) {
                                return cfgScaleSelect.value;
                            } else if (model.includes('flux')) {
                                return 1.0;
                            } else if (model.includes('sd_xl_base')) {
                                return 7.0;
                            } else {
                                return 8.0;
                            }
                        })(),
                        "sampler_name": (function() {
                            if (advancedCheckbox.checked) {
                                return samplerSelect.value;
                            } else if (model.includes('flux')) {
                                return "euler";
                            } else if (model.includes('sd_xl_base')) {
                                return "dpmpp_2s_ancestral";
                            } else {
                                return "euler";
                            }
                        })(),
                        "scheduler": (function() {
                            if (advancedCheckbox.checked) {
                                return schedulerSelect.value;
                            } else if (model.includes('flux')) {
                                return "simple";
                            } else {
                                return "normal";
                            }
                        })(),
                        "denoise": advancedCheckbox.checked ? noiseSlider.value : 1,
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
                        "text": advancedCheckbox.checked ? prompt2 : "",
                        "clip": ["30", 1]
                    },
                    "class_type": "CLIPTextEncode",
                    "_meta": { "title": "负面提示*" }
                }
            }

            console.log(data);
            

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

    loadAppMain()

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
                    const fs = require('fs');
                    const path = require('path');
                    const child_process = require('child_process');
                    const sevenBin = require('7zip-bin'); // 引入7zip-bin模块
            
                    // 目标文件夹
                    const extractDir = path.join(comfyUIPathPython);
                    
                    // 确保目标文件夹存在
                    if (!fs.existsSync(extractDir)) {
                        fs.mkdirSync(extractDir, { recursive: true });
                    }
                    
                    // 保存下载的文件（这里假设 buffer 是下载的数据）
                    const downloadedFilePath = path.join(comfyUIPathPython, "Git.exe");
                    fs.writeFileSync(downloadedFilePath, Buffer.from(buffer));
                    console.log("文件已保存，用于解压：", downloadedFilePath);
            
                    // 构造解压命令，使用 7zip-bin 提供的 7za 路径
                    // 解压到 extractDir/Git 目录下
                    const command = `"${sevenBin.path7za}" x "${downloadedFilePath}" -o"${path.join(extractDir, 'Git')}" -y`;
                    console.log("执行解压命令：", command);
            
                    child_process.exec(command, (error, stdout, stderr) => {
                        if (error) {
                            console.error("解压失败：", error);
                            openDialog('error', '解压失败', `解压失败。`);
                            
                            // 出错时删除临时下载的文件（如果存在）
                            if (fs.existsSync(downloadedFilePath)) {
                                fs.unlinkSync(downloadedFilePath);
                                console.log("已删除临时文件：", downloadedFilePath);
                            }
                            return;
                        }
                        
                        console.log("Extraction complete.");
                        console.log("stdout:", stdout);
                        if (stderr) {
                            console.error("stderr:", stderr);
                        }
                        
                        // 解压完成后删除临时的下载文件
                        if (fs.existsSync(downloadedFilePath)) {
                            fs.unlinkSync(downloadedFilePath);
                            console.log("已删除临时文件：", downloadedFilePath);
                        }
                        
                        // 隐藏进度条（此处假设页面中存在 id 为 git-progress 的元素）
                        const gitProgressEl = document.querySelector("#git-progress");
                        if (gitProgressEl) {
                            gitProgressEl.style.display = 'none';
                        }
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
                setInterval(() => {
                    comfyuiManagerSwitch.checked = true
                    comfyuiManagerSwitch.disabled = true;
                }, 1000);
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
                setInterval(() => {
                    comfyuiGgufSwitch.checked = true
                    comfyuiGgufSwitch.disabled = true;
                }, 1000);
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
    const totalFiles = files.length;
    const downloadRequests = [];
    // 保存每个下载任务的信息，用于取消后删除未完成文件
    const downloadInfos = [];
  
    const updateDialogToComplete = () => {
      dialog_d.icon = "cloud_done";
      dialog_d.querySelector('div[slot="headline"]').innerHTML = '已完成下载';
      cancelButton.style.display = 'none';
      doneButton.style.display = 'inline-block';
    };
  
    const checkAllComplete = () => {
      if (completedDownloads >= totalFiles) {
        updateDialogToComplete();
      }
    };
  
    // 下载函数，支持自动跟随重定向（最多 5 次）
    function downloadWithRedirect(url, filePath, progressBar, progressText, downloadInfo, redirectCount = 0) {
      const protocol = url.startsWith('https') ? require('https') : require('http');
      const req = protocol.get(url, (res) => {
        // 如果响应状态码为 3xx 且有重定向地址，则重新下载
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          if (redirectCount >= 5) { // 防止重定向过多
            progressText.textContent = '❌ 重定向次数过多';
            completedDownloads++;
            checkAllComplete();
            return;
          }
          // 处理可能的相对重定向地址
          const newUrl = new URL(res.headers.location, url).href;
          downloadWithRedirect(newUrl, filePath, progressBar, progressText, downloadInfo, redirectCount + 1);
          return;
        }
  
        if (res.statusCode !== 200) {
          progressText.textContent = '❌ 下载失败';
          completedDownloads++;
          checkAllComplete();
          return;
        }
  
        // 开始流式写入文件
        const totalSize = parseInt(res.headers['content-length'] || '0', 10);
        let downloadedSize = 0;
        const writeStream = fs.createWriteStream(filePath);
  
        res.on('data', (chunk) => {
          downloadedSize += chunk.length;
          if (totalSize) {
            const progress = (downloadedSize / totalSize) * 100;
            progressBar.value = progress;
            progressText.textContent = `${progress.toFixed()}% [${(downloadedSize / 1024 / 1024).toFixed(2)} MB / ${(totalSize / 1024 / 1024).toFixed(2)} MB]`;
          } else {
            progressText.textContent = `${(downloadedSize / 1024 / 1024).toFixed(2)} MB 已下载`;
          }
        });
  
        res.pipe(writeStream);
  
        writeStream.on('finish', () => {
          writeStream.close(() => {
            // 标记为已完成
            downloadInfo.completed = true;
            completedDownloads++;
            progressText.innerHTML = '<mdui-icon>check</mdui-icon>';
            checkAllComplete();
          });
        });
  
        writeStream.on('error', (err) => {
          console.error(err);
          progressText.innerHTML = '<mdui-icon>close</mdui-icon> 保存失败';
          completedDownloads++;
          checkAllComplete();
        });
      }).on('error', (err) => {
        console.error(err);
        progressText.innerHTML = '<mdui-icon>close</mdui-icon> 网络错误';
        completedDownloads++;
        checkAllComplete();
      });
  
      downloadRequests.push(req);
    }
  
    files.forEach(file => {
      const [folderPath, url] = file;
      const fileName = url.split('/').pop();
      const fullFolderPath = path.join(modelPath, folderPath);
      const filePath = path.join(fullFolderPath, fileName);
      const fileUuid = `progress-${crypto.randomUUID()}`;
  
      // 如果目标文件夹不存在，则递归创建
      if (!fs.existsSync(fullFolderPath)) {
        fs.mkdirSync(fullFolderPath, { recursive: true });
      }
  
      // 创建当前文件的进度显示项
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
  
      // 如果文件已存在，则直接提示并计入完成数
      if (fs.existsSync(filePath)) {
        progressBar.value = 100;
        progressText.innerHTML = '<mdui-icon>check</mdui-icon> 已存在';
        completedDownloads++;
        checkAllComplete();
        return;
      }
  
      // 创建一个下载信息对象，用于后续取消时删除未完成的文件
      const downloadInfo = {
        filePath: filePath,
        completed: false
      };
      downloadInfos.push(downloadInfo);
  
      // 开始下载，并自动处理重定向
      downloadWithRedirect(url, filePath, progressBar, progressText, downloadInfo);
    });
  
    // “取消”按钮：中止所有正在进行的下载，删除未完成的文件，并关闭对话框
    cancelButton.addEventListener('click', () => {
      // 终止所有请求
      downloadRequests.forEach(req => {
        if (req && typeof req.abort === 'function') {
          req.abort();
        }
      });
      // 删除所有未完成的下载文件
      downloadInfos.forEach(info => {
        if (!info.completed && fs.existsSync(info.filePath)) {
          fs.unlink(info.filePath, (err) => {
            if (err) {
              console.error(`删除 ${info.filePath} 失败:`, err);
            } else {
              console.log(`已删除未完成文件: ${info.filePath}`);
            }
          });
        }
      });
      document.body.removeChild(dialog_d);
    });
  
    // “完成”按钮：关闭对话框
    doneButton.addEventListener('click', () => {
      document.body.removeChild(dialog_d);
    });
  };
  
  
