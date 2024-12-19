//载入node.js文件模块
const fs = require('fs');
const path = require('path');

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

/* 窗口管理 */
const { ipcRenderer } = require('electron');

const minimizeWindow = () => {
    ipcRenderer.send('minimize');
}

const closeWindow = () => {
    ipcRenderer.send('close');
}

const toggleTopmost = () => {
    ipcRenderer.send('toggle-topmost');
}

//载入
window.onload = function() {
    document.body.classList.add('on');
            
    //检测 ../ComfyUI文件夹是否存在，不存在就下载并解压
    const ComfyUIDir = path.join(process.cwd(), '../ComfyUI/ComfyUI_windows_portable_nvidia');
    if (!fs.existsSync(ComfyUIDir)) {
        switchPage("page-welcome");
        
        $('page #page-welcome-next').addEventListener('click', () => {

            switchPage("page-welcome-comfyui"); // 切换到下载页面
        
            //const downloadUrl = 'https://github.com/comfyanonymous/ComfyUI/releases/latest/download/ComfyUI_windows_portable_nvidia.7z';
            const downloadUrl = `https://github.com/panda44312/adad/releases/download/a/ComfyUI_windows_portable_nvidia.7z`
            fs.mkdirSync(path.join(process.cwd(), '../ComfyUI'), {recursive: true});

            var progressBar = $('.page-welcome-comfyui #progress-bar');
        
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
                    console.log(`${Math.round(progress)}`);
        
                    // 计算下载速度
                    const elapsedTime = (Date.now() - startTime) / 1000; // 秒
                    const speed = (receivedBytes / 1024) / elapsedTime; // KB/s
                    console.log(`${Math.round(speed)}`);
        
                    // 计算预计剩余时间
                    const remainingBytes = totalLength - receivedBytes;
                    const etaSeconds = Math.round(remainingBytes / (speed * 1024));
                    const etaMinutes = Math.floor(etaSeconds / 60);
                    const remainingSeconds = etaSeconds % 60;
                    console.log(`${etaMinutes}：${remainingSeconds}`);
                }
            };


            xhr.onload = async () => {
                if (xhr.status === 200) {
                    const buffer = xhr.response; // 获取二进制数据
                    console.log("File downloaded successfully.");
            
                    try {
                        // 载入node.js文件模块
                        const fs = require('fs');
                        const path = require('path');
                        const child_process = require('child_process');
            
                        // 目标文件夹
                        const extractDir = path.resolve(__dirname, "../ComfyUI/");
            
                        // 确保目标文件夹存在
                        if (!fs.existsSync(extractDir)) {
                            fs.mkdirSync(extractDir, { recursive: true });
                        }
            
                        // 保存下载的文件
                        const downloadedFilePath = path.join(extractDir, "ComfyUI_windows_portable_nvidia.7z");
                        
                        fs.writeFileSync(downloadedFilePath, Buffer.from(buffer));
            
                        console.log("File saved for extraction.");
                        
                        // 保存sevenZipData为 ../7z.exe文件
                        fs.writeFileSync(path.join(process.cwd(), '../7z.exe'), fs.readFileSync('./7z'));
                        
                        // 执行7z.exe命令，执行完删除../7z.exe文件
                        const command = `"../7z.exe" x "${downloadedFilePath}" -o"${extractDir}/ComfyUI_windows_portable_nvidia/" -y`;

                        child_process.exec(command, (error, stdout, stderr) => {
                            if (error) {
                                alert(`解压失败。${error}`);
                                switchPage("page-welcome");
                                return;
                            }
            
                            console.log("Extraction complete.");
                            switchPage("page-welcome");
            
                            // 删除临时的下载文件
                            fs.unlinkSync(downloadedFilePath);
                            // 删除无用文件
                            fs.unlinkSync(`../7z.exe`);
                        });
            
                    } catch (err) {
                        console.error("Error during extraction:", err);
                        alert(`Error during extraction: ${err}`);
                        switchPage("page-welcome");
                    }
                } else {
                    alert(`Download failed with status: ${xhr.status}`);
                    console.error(`Download failed with status: ${xhr.status}`);
                    switchPage("page-welcome");
                }
            };
            
            
            
            
            // 确保 xhr.responseType 设置为 arraybuffer
            xhr.responseType = "arraybuffer";
            
        
            xhr.onerror = () => {
                console.error("Error during download.");
                switchPage("page-welcome");
            };
        
            xhr.send(); // 发送请求
        });        
        
    } else {
        console.log('ComfyUI已存在，直接跳过下载和解压过程。');
        
        switchPage("page-main"); // 直接切换到主页面
    }

}
