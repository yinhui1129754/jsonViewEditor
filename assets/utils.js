
// 浏览器端URL处理库 - 类似Node.js path模块
const URLPath = {
    // 解析URL路径部分
    parse(url) {
        try {
            const parsedUrl = new URL(url, 'http://dummy');
            const pathname = parsedUrl.pathname;
            const segments = pathname.split('/').filter(segment => segment !== '');
            const basename = segments.length > 0 ? segments[segments.length - 1] : '';
            const extIndex = basename.lastIndexOf('.');

            return {
                root: pathname.startsWith('/') ? '/' : '',
                dir: pathname.substring(0, pathname.lastIndexOf('/') + 1),
                base: basename,
                ext: extIndex > 0 ? basename.substring(extIndex) : '',
                name: extIndex > 0 ? basename.substring(0, extIndex) : basename
            };
        } catch (error) {
            // 如果不是有效的URL，则尝试将其作为相对路径处理
            const pathname = url;
            const segments = pathname.split('/').filter(segment => segment !== '');
            const basename = segments.length > 0 ? segments[segments.length - 1] : '';
            const extIndex = basename.lastIndexOf('.');

            return {
                root: pathname.startsWith('/') ? '/' : '',
                dir: pathname.substring(0, pathname.lastIndexOf('/') + 1),
                base: basename,
                ext: extIndex > 0 ? basename.substring(extIndex) : '',
                name: extIndex > 0 ? basename.substring(0, extIndex) : basename
            };
        }
    },

    // 连接多个URL路径部分
    join(...paths) {
        // 过滤掉空路径
        const filteredPaths = paths.filter(path => path !== '');

        if (filteredPaths.length === 0) {
            return '';
        }

        // 处理根路径
        const root = filteredPaths[0].startsWith('/') ? '/' : '';

        // 合并路径部分并规范化
        const mergedPath = filteredPaths
            .map(path => path.replace(/^\/+/, '').replace(/\/+$/, ''))
            .filter(segment => segment !== '')
            .join('/');

        return root + mergedPath;
    },

    // 规范化URL路径，处理..和.
    normalize(url) {
        try {
            const parsedUrl = new URL(url, 'http://dummy');
            const pathSegments = parsedUrl.pathname.split('/');
            const normalizedSegments = [];

            for (const segment of pathSegments) {
                if (segment === '..') {
                    normalizedSegments.pop();
                } else if (segment !== '' && segment !== '.') {
                    normalizedSegments.push(segment);
                }
            }

            // 处理根路径
            const root = parsedUrl.pathname.startsWith('/') ? '/' : '';
            const normalizedPath = root + normalizedSegments.join('/');

            // 保留原始的协议、主机和查询参数
            return new URL(normalizedPath, parsedUrl).toString();
        } catch (error) {
            // 如果不是有效的URL，则作为相对路径处理
            const pathSegments = url.split('/');
            const normalizedSegments = [];

            for (const segment of pathSegments) {
                if (segment === '..') {
                    normalizedSegments.pop();
                } else if (segment !== '' && segment !== '.') {
                    normalizedSegments.push(segment);
                }
            }

            // 处理根路径
            const root = url.startsWith('/') ? '/' : '';
            return root + normalizedSegments.join('/');
        }
    },

    // 获取目录名
    dirname(url) {
        try {
            const parsedUrl = new URL(url, 'http://dummy');
            const pathname = parsedUrl.pathname;
            const lastSlashIndex = pathname.lastIndexOf('/');

            if (lastSlashIndex === -1) {
                return '.';
            } else if (lastSlashIndex === 0) {
                return '/';
            }

            return pathname.substring(0, lastSlashIndex);
        } catch (error) {
            // 作为相对路径处理
            const pathname = url;
            const lastSlashIndex = pathname.lastIndexOf('/');

            if (lastSlashIndex === -1) {
                return '.';
            } else if (lastSlashIndex === 0) {
                return '/';
            }

            return pathname.substring(0, lastSlashIndex);
        }
    },

    // 获取基本文件名
    basename(url, ext = '') {
        try {
            const parsedUrl = new URL(url, 'http://dummy');
            const pathname = parsedUrl.pathname;
            const segments = pathname.split('/');
            const filename = segments[segments.length - 1] || '';

            if (ext && filename.endsWith(ext)) {
                return filename.slice(0, -ext.length);
            }

            return filename;
        } catch (error) {
            // 作为相对路径处理
            const pathname = url;
            const segments = pathname.split('/');
            const filename = segments[segments.length - 1] || '';

            if (ext && filename.endsWith(ext)) {
                return filename.slice(0, -ext.length);
            }

            return filename;
        }
    },

    // 获取文件扩展名
    extname(url) {
        try {
            const parsedUrl = new URL(url, 'http://dummy');
            const pathname = parsedUrl.pathname;
            const segments = pathname.split('/');
            const filename = segments[segments.length - 1] || '';
            const lastDotIndex = filename.lastIndexOf('.');

            return lastDotIndex > 0 ? filename.substring(lastDotIndex) : '';
        } catch (error) {
            // 作为相对路径处理
            const pathname = url;
            const segments = pathname.split('/');
            const filename = segments[segments.length - 1] || '';
            const lastDotIndex = filename.lastIndexOf('.');

            return lastDotIndex > 0 ? filename.substring(lastDotIndex) : '';
        }
    },

    // 判断是否为绝对路径
    isAbsolute(url) {
        try {
            new URL(url);
            return true;
        } catch (error) {
            return url.startsWith('/') || url.startsWith('http://') || url.startsWith('https://');
        }
    },

    // 相对路径计算
    relative(from, to) {
        try {
            const fromUrl = new URL(from, 'http://dummy');
            const toUrl = new URL(to, 'http://dummy');

            if (fromUrl.origin !== toUrl.origin) {
                return toUrl.href;
            }

            const fromPath = fromUrl.pathname.split('/').filter(segment => segment !== '');
            const toPath = toUrl.pathname.split('/').filter(segment => segment !== '');

            let i = 0;
            while (i < fromPath.length && i < toPath.length && fromPath[i] === toPath[i]) {
                i++;
            }

            const up = '../'.repeat(fromPath.length - i);
            const down = toPath.slice(i).join('/');

            return up + down || '.';
        } catch (error) {
            // 作为相对路径处理
            const fromPath = from.split('/').filter(segment => segment !== '');
            const toPath = to.split('/').filter(segment => segment !== '');

            let i = 0;
            while (i < fromPath.length && i < toPath.length && fromPath[i] === toPath[i]) {
                i++;
            }

            const up = '../'.repeat(fromPath.length - i);
            const down = toPath.slice(i).join('/');

            return up + down || '.';
        }
    },

    // 格式化路径对象为路径字符串
    format(pathObject) {
        const { root = '', dir = '', base = '', ext = '', name = '' } = pathObject;

        if (!dir && !root) {
            return base || (name + ext);
        }

        const directory = dir || root;
        const fileName = base || (name + ext);

        return this.join(directory, fileName);
    },

    // URL编码
    encode(url) {
        try {
            const parsedUrl = new URL(url);
            return parsedUrl.toString();
        } catch (error) {
            // 作为相对路径处理
            return encodeURI(url);
        }
    },

    // URL解码
    decode(url) {
        try {
            return decodeURI(url);
        } catch (error) {
            return url;
        }
    }
};

function convertToVSCodeUri(relativePath) {
    // 确保路径以 baseUri 为根目录
    return URLPath.join(window.vscodeBaseUri, relativePath)
};

// utils.js（Webview 前端脚本）
(function () {
    const OriginalWorker = window.Worker;


    // 重写 Worker 构造函数
    window.Worker = function (scriptURL, options) {
        // 处理字符串或 URL 对象
        let resolvedUrl;
        if (typeof scriptURL === 'string') {
            resolvedUrl = convertToVSCodeUri(scriptURL);
        } else if (scriptURL instanceof URL) {
            resolvedUrl = convertToVSCodeUri(scriptURL.href);
        } else {
            throw new Error('Unsupported scriptURL type');
        }

        // 创建 Worker 实例
        return new OriginalWorker(resolvedUrl, options);
    };
})();


// utils.js
(function () {
    // 拦截 XMLHttpRequest
    const originalXHR = window.XMLHttpRequest;
    window.XMLHttpRequest = function () {
        const xhr = new originalXHR();
        const originalOpen = xhr.open;
        xhr.open = function (method, url, async) {
            const newUrl = url.startsWith('http') ? url : convertToVSCodeUri(url);
            originalOpen.call(xhr, method, newUrl, async);
        };
        return xhr;
    };

    // 拦截 Fetch
    const originalFetch = window.fetch;
    window.fetch = async function (input, init) {
        const newInput = input instanceof Request ?
            input :
            new Request(
                input.startsWith('http') ? input : convertToVSCodeUri(input),
                init
            );
        return originalFetch(newInput, init);
    };
})();

var scriptOriginsetAttribute = Element.prototype.setAttribute

Element.prototype.setAttribute = function (name, value) {
    // 处理src和href属性
    if (name === 'src' || name === 'href') {
        var url = value
        if (!url.startsWith('http')) {
            if (url.startsWith("vscode")) {
                url = url.replace(window.location.origin, "")
            }

            // this.setAttribute('src', convertToVSCodeUri(url));
            value = convertToVSCodeUri(url);
            // element[attr] = convertToVSCodeUri(url);
        }
    }
    // 调用原始方法
    return scriptOriginsetAttribute.call(this, name, value);
};
const scriptProto = HTMLScriptElement.prototype;
Object.defineProperty(scriptProto, 'src', {
    get() {
        return this.getAttribute('src');
    },
    set(value) {
        // console.log()
        // if (value && (value.startsWith('/') || value.startsWith('./'))) {
        //     value = requestConfig.resourceDomain + value.replace(/^\.?\//, '/');
        // }
        var url = value
        if (!url.startsWith('http')) {
            if (url.startsWith("vscode")) {
                url = url.replace(window.location.origin, "")
            }
            // console.log(url)
            this.setAttribute('src', convertToVSCodeUri(url));
            value = convertToVSCodeUri(url);
            // element[attr] = convertToVSCodeUri(url);
        }

        return value;
    }
});
