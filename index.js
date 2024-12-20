//载入node.js文件模块
const fs = require('fs');
const path = require('path');
const { ipcRenderer } = require('electron');
const { exec } = require('child_process');
const child_process = require('child_process');
const http = require('http');
const { console } = require('inspector');

const port = 8190;
//全局变量

const downloadUrl = 'https://github.com/comfyanonymous/ComfyUI/releases/latest/download/ComfyUI_windows_portable_nvidia.7z';
//const downloadUrl = 'https://github.com/panda44312/adad/releases/download/a/ComfyUI_windows_portable_nvidia.7z';
const modelUrl = '';

ipcRenderer.send('getUserDataPath');
let   userDataPath;
let   comfyUIPath;
let   modelPath;
let comfyUIPathPython;

ipcRenderer.on('userDataPath', (event, configPath) => {
     userDataPath = configPath;
     comfyUIPath = path.join(userDataPath, './ComfyUI');
     comfyUIPathPython = path.join(userDataPath, './ComfyUI/ComfyUI_windows_portable_nvidia/ComfyUI_windows_portable');
     modelPath = path.join(comfyUIPath, '/ComfyUI_windows_portable_nvidia/ComfyUI_windows_portable/ComfyUI/models/checkpoints');
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
                    const extractDir = comfyUIPath;
        
                    // 确保目标文件夹存在
                    if (!fs.existsSync(extractDir)) {
                        fs.mkdirSync(extractDir, { recursive: true });
                    }
        
                    // 保存下载的文件
                    const downloadedFilePath = path.join(extractDir, "ComfyUI_windows_portable_nvidia.7z");
                    
                    fs.writeFileSync(downloadedFilePath, Buffer.from(buffer));
        
                    console.log("File saved for extraction.");
                    switchPage("page-welcome-complete");
                    
                    // 执行7z.exe命令，执行完删除../7z.exe文件
                    const command = `"${path.join(process.cwd(), './7z.exe')}" x "${downloadedFilePath}" -o"${extractDir}/ComfyUI_windows_portable_nvidia/" -y`;

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
    const cpu = setInterval(() => {
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
            const memoryUsage = `${(adjustedUsedMemory / (1024 * 1024 * 1024)).toFixed(1)}GB/${(totalMemory / (1024 * 1024 * 1024)).toFixed(1)}GB`;
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
            const memoryUsage = `${(usedMemory / (1024 * 1024 * 1024)).toFixed(1)}GB/${(totalMemory / (1024 * 1024 * 1024)).toFixed(1)}GB`;
            AppBottomBar.querySelector('#gpu-memory-used').textContent = memoryUsage;
        });

    }, 1000);


    // 检测用户是否有显卡
    let comfyUIProcess;
    const checkServer = (port, callback) => {
        const options = {
            method: 'HEAD',
            host: '127.0.0.1',
            port: port,
            path: '/'
        };

        const req = http.request(options, (res) => {
            callback(res.statusCode === 200);
        });

        req.on('error', () => {
            callback(false);
        });

        req.end();
    };

    checkServer(port, (isRunning) => {
        if (isRunning) {
            console.log(`Server is already running on port ${port}.`);
            $(".container-comfyui-web").src = `http://127.0.0.1:${port}`;
        } else {
            exec('wmic path win32_VideoController get name', (err, stdout, stderr) => {
                if (err) {
                    openDialog('error', '显卡检测失败', '显卡检测过程中发生错误。');
                    return;
                }
                if (stdout.includes("NVIDIA")) {
                    console.log("NVIDIA显卡检测通过。");
                    const command = `"${path.join(comfyUIPathPython, 'python_embeded/python.exe')}" -s ${path.join(comfyUIPathPython, 'ComfyUI/main.py')} --port ${port}  `;
                    comfyUIProcess = exec(command, (err, stdout, stderr) => {
                        if (err) {
                            openDialog('error', '启动失败', 'ComfyUI启动失败。');
                        } else {
                            console.log("ComfyUI started successfully with NVIDIA GPU.");
                            
                            $(".container-comfyui-web").src = `http://127.0.0.1:${port}`;
                            console.log(stdout);
                        }
                    });
                } else {
                    openDialog('error', '显卡检测失败', '检测到您的电脑没有NVIDIA显卡，ComfyUI将使用CPU运行，速度可能会较慢。');
                    console.log("No NVIDIA GPU detected. Starting with CPU...");
                    const command = `"${path.join(comfyUIPathPython, 'python_embeded/python.exe')}" -s ${path.join(comfyUIPathPython, 'ComfyUI/main.py')} --port ${port} --cpu`;
                    comfyUIProcess = exec(command, (err, stdout, stderr) => {
                        if (err) {
                            openDialog('error', '启动失败', 'ComfyUI启动失败。');
                        } else {
                            console.log("ComfyUI started successfully with CPU.");
                            
                            $(".container-comfyui-web").src = `http://127.0.0.1:${port}`;
                            console.log(stdout);
                        }
                    });
                }
            });

        }
    });

    // modelPath载入到列表中
    const modelList = $(".container-model #model-list");
    const modelPathE = $(".container-model #model-path");
    const modelPathButton = $(".container-model #model-path-button");
    const modelUploadButton = $(".container-model #model-upload");

    modelPathE.value = modelPath;
    fs.readdir(modelPath, (err, files) => {
        if (err) {
            console.error(err);
            return;
        }
        files.forEach(file => {
            if (file !== 'put_checkpoints_here') {
                const modelItem = document.createElement("md-list-item");
                modelItem.innerHTML = `
                    <md-icon slot="start">deployed_code</md-icon>
                    <span>${file}</span>
                    <md-text-button slot="end" onclick="deleteModel('${file}')">删除</md-text-button>
                `;
                modelList.appendChild(modelItem);
            }
        });
    });

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

    //图片生成逻辑
    const generateButton = $("#app-core-image-generator #generate-button");

    generateButton.onclick = () => {

        //获取完整数据
        const modelSelect = $("#app-core-image-generator #model-select");
        const textField = $("#app-core-image-generator #prompt");
        const sizeSelect = $("#app-core-image-generator #size-select");
        const steps = $("#app-core-image-generator #setps-slider");
        const batchSize = $("#app-core-image-generator #batch-size");

        if(batchSize.value === '0') {
            batchSize.value = 1;
        }

        if (steps.value === '0') {
            steps.value = 20;
        }

        if (textField.value === '') {
            openDialog('error', '生成失败', '请输入一个提示词。');
            return;
        }

        if (modelSelect.value === '') {
            openDialog('error', '生成失败', '请选择一个模型。');
            return;
        }

        const model = modelSelect.value;
        const prompt = textField.value;
        const size = sizeSelect.value;
        const seedValue = Math.floor(Math.random() * Math.pow(2, 32));
        const stepsValue = steps.value;
        const sizeValue = size.split('x');
        const batchSizeValue = batchSize.value;

        generateButton.disabled = true;
        generateButton.textContent = "生成中...";

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
                "seed": seedValue,
                "steps": stepsValue,
                "cfg": 1,
                "sampler_name": "euler",
                "scheduler": "simple",
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
                "title": "负面提升*"
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
                                const image = document.createElement('img');
                                image.src = imageUrl;
                                const imageContainer = $("#app-core-image-viewer");
                                imageContainer.appendChild(image);
                            }
                        })
                        .catch(err => {
                            console.error(err);
                            openDialog('error', '生成失败', '获取生成历史过程中发生错误。');
                        });
    
                    generateButton.textContent = "生成";
                    generateButton.disabled = false;

                }
            }
            
        }


    }
        


}

//diglog
const openDialog = (icon, headline, content) => {
    const dialog = document.createElement('md-dialog');
    dialog.setAttribute('type', 'alert');
    dialog.innerHTML = `
        <div slot="headline"><md-icon>${icon}</md-icon>${headline}</div>
        <form slot="content" id="form-id" method="dialog">
            ${content}
        </form>
        <div slot="actions">
            <md-text-button form="form-id" value="ok">确定</md-text-button>
        </div>

    `;
    document.body.appendChild(dialog);
    dialog.show();
    dialog.addEventListener('close', () => {
        document.body.removeChild(dialog);
    });
}

const downloadModel = (url) => {
    //                <md-text-button slot="e        nd" data-download-url="https://huggingface.co/Comfy-Org/flux1-schnell/resolve/main/flux1-schnell-fp8.safetensors">下载</md-text-button>
    const dialog = document.createElement('md-dialog');
    dialog.setAttribute('type', 'alert');
    dialog.innerHTML = `
        <div slot="headline"><md-icon>cloud_download</md-icon>确认下载</div>
        <form slot="content" id="form-id" method="dialog">
            您确定要下载此模型吗？
        </form>
        <div slot="actions">
            <md-text-button form="form-id" value="cancel">取消</md-text-button>
            <md-text-button form="form-id" value="download">下载</md-text-button>
        </div>
    `;
    document.body.appendChild(dialog);

    //如果点击了下载，使用xmlhttprequest下载模型，然后用fs保存到模型目录，使用
    //            <md-linear-progress id="progress-bar" value="0" max="100"></md-linear-progress>
    // 来显示下载进度
    dialog.addEventListener('close', () => {
        if (dialog.returnValue === 'download') {
            
            //再打开dialog，显示下载进度，如果点击取消，就停止下载。
            const dialog_d = document.createElement('md-dialog');
            dialog_d.setAttribute('type', 'alert');
            dialog_d.innerHTML = `
                <div slot="headline"><md-icon>cloud_download</md-icon>下载进度</div>
                <form slot="content" id="form-id" method="dialog">
                    <md-linear-progress id="progress-bar" value="0" max="100"></md-linear-progress>
                    <p id="progress-text"></p>
                </form>
                <div slot="actions">
                    <md-text-button form="form-id" value="cancel">取消</md-text-button>
                </div>
            `;
            document.body.appendChild(dialog_d);

            dialog_d.show();

            dialog_d.addEventListener('close', () => {
                if (dialog_d.returnValue === 'cancel') {
                    xhr.abort();
                }
                document.body.removeChild(dialog_d);
            });

            const progressBar = dialog_d.querySelector('#progress-bar');
            const progressText = dialog_d.querySelector('#progress-text');
            let   startTime = Date.now();


            const xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.responseType = 'arraybuffer';
            xhr.onprogress = (event) => {
                if (event.lengthComputable) {
                    const totalLength = event.total;
                    const receivedBytes = event.loaded;
                    const progress = (receivedBytes / totalLength) * 100;
                    progressBar.value = progress;
                }
            };
            xhr.onload = () => {
                if (xhr.status === 200) {                    
                    const buffer = xhr.response;
                    const fileName = url.split('/').pop();
                    fs.writeFile(path.join(modelPath, fileName), Buffer.from(buffer), (err) => {
                        if (err) {
                            console.error(err);
                            return;
                        }
                        const modelItem = document.createElement("md-list-item");
                        modelItem.innerHTML = `
                            <md-icon slot="start">deployed_code</md-icon>
                            <span>${fileName}</span>
                            <md-text-button slot="end" onclick="deleteModel('${fileName}')">删除</md-text-button>
                        `;
                        document.querySelector('.page-model #model-list').appendChild(modelItem);
                    });
                } else {
                    openDialog('error', '下载失败', '下载模型过程中发生错误。');
                }
                dialog.hide();
            };

            xhr.onerror = () => {
                openDialog('error', '下载失败', '下载模型过程中发生错误。');
                dialog.hide();
            };
            xhr.send();
        }
        document.body.removeChild(dialog);
    });
        
    dialog.show();
}

//载入
window.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('on');
            
    //检测 ../ComfyUI文件夹是否存在，不存在就下载并解压
    const ComfyUIDir = path.join(userDataPath, './ComfyUI/ComfyUI_windows_portable_nvidia');

    if (!fs.existsSync(ComfyUIDir)) {
        getComfyUIDir();
    } else {
        console.log('ComfyUI已存在，直接跳过下载和解压过程。');
        loadApp();
    }
});
