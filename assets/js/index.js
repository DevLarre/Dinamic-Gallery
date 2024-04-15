const addButton = document.querySelector(`[data-js-button="add-image"]`);
const imageContainer = document.querySelector(`[data-js-container="images"]`);
const uploadInput = document.querySelector(`[data-js-input-import="upload"]`);
const dropzone = document.querySelector(`[data-js-dropzone="dropzone"]`);
const emptyGalleryMessage = document.querySelector(`[data-js-message="empty-gallery"]`);
const pageLoader = document.querySelector(`[data-js-preloader="preloader"]`);
const localStorageKey = `images`;

const clearLocalStorageOnLoad = () => {
    if (!localStorage.getItem(localStorageKey)) {
        localStorage.removeItem(localStorageKey);
    }
};

let imagesArray = [];

const getDataLocalStorage = () => JSON.parse(localStorage.getItem(localStorageKey));
const setDataLocalStorage = () => localStorage.setItem(localStorageKey, JSON.stringify(imagesArray));
const renderImages = () => {
    imagesArray.forEach(data => {
        imageContainer.innerHTML += `
            <div data-js-id="${data.id}">
                <img src="${data.src}" alt="Imagem">
                <button data-js-button="delete">X</button>
            </div>
        `;
    });
};
const instanceateNewFileReader = () => new FileReader();
const createElement = elementName => document.createElement(elementName);
const appendChild = (parentElement, child) => parentElement.appendChild(child);
const setAttribute = (element, attribuite, value) => element.setAttribute(attribuite, value);
const removeClass = (element, classname) => element.classList.remove(classname);
const clearUploadInput = () => uploadInput.value = ``;
const pageReload = () => location.reload();
const pagePreloaderAndLoader = () => {
    setTimeout(() => {
        pageLoader.style.display = 'none';
    }, 1000);
};

const compressImage = (result, quality) => {
    return new Promise((resolve) => {

        const image = new Image();

        image.onload = () => {
            const canvas = document.createElement(`canvas`);
            const dimension = `2d`
            const contextCanvas = canvas.getContext(dimension);
            const maxWidth = 600;

            let width = image.width;
            let height = image.height;

            if (width > maxWidth) {
                height *= maxWidth / width;
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;

            contextCanvas.drawImage(image, 0, 0, width, height);

            canvas.toBlob((blob) => {
                const compressedReader = new FileReader();

                compressedReader.onload = () => {
                    resolve({
                        blobSize: blob.size,
                        compressedReader: compressedReader.result,
                    });
                };

                compressedReader.readAsDataURL(blob);

            },
                'image/png', quality
            );
        }

        image.src = result;
    });
};

const generateImageId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

addButton.addEventListener('click', () => {
    const fileList = uploadInput.files;
    if (fileList.length === 0) {
        alert('Escolha um arquivo...');
        return;
    }
    const file = fileList[0];
    const fileSize = fileList[0].size;

    const fileReader = instanceateNewFileReader();
    fileReader.readAsDataURL(file);

    fileReader.onload = async () => {
        const result = fileReader.result;
        const quality = 0.7;
        const { blobSize, compressedReader } = await compressImage(result, quality);

        const objectImage = {
            id: generateImageId(),
            originalSize: fileSize,
            modifiedSize: blobSize,
            src: compressedReader,
        };

        imagesArray.unshift(objectImage);
        setDataLocalStorage();
        renderImages();
        emptyGalleryMessage.style.display = imagesArray.length > 0 ? 'none' : '';
        clearUploadInput();
        pageReload();
    };
});

window.document.addEventListener(`click`, (event) => {
    const target = event.target;
    const isButtonDelete = (target.dataset.jsButton === `delete`);

    if (!isButtonDelete) return;


    const parentElement = target.parentElement;
    const parentId = parentElement.dataset.jsId;

    imagesArray = imagesArray.filter(data => data.id !== parentId);
    setDataLocalStorage();
    parentElement.remove();
    pageReload();
});

window.document.addEventListener(`DOMContentLoaded`, () => {
    clearLocalStorageOnLoad();

    imagesArray = getDataLocalStorage() || [];
    renderImages();
    pagePreloaderAndLoader();
});


dropzone.addEventListener('click', () => {
    uploadInput.click();
});

uploadInput.addEventListener('change', () => {
    handleFiles(uploadInput.files);
});


dropzone.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropzone.classList.add('dragover');
});

dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
});

dropzone.addEventListener('drop', (event) => {
    event.preventDefault();
    dropzone.classList.remove('dragover');
    handleFiles(event.dataTransfer.files);
});

function handleFiles(files) {
    if (files.length === 0) {
        return;
    }

    for (const file of files) {
        if (!file.type.startsWith('image/')) {
            continue;
        }

        const fileReader = new FileReader();

        fileReader.onload = async () => {
            const result = fileReader.result;
            const quality = 0.7;
            const { blobSize, compressedReader } = await compressImage(result, quality);

            const objectImage = {
                id: generateImageId(), // Gerar um ID único para a imagem
                originalSize: file.size,
                modifiedSize: blobSize,
                src: compressedReader,
            };

            imagesArray.unshift(objectImage);
            setDataLocalStorage();
            renderImages();
            emptyGalleryMessage.style.display = imagesArray.length > 0 ? 'none' : '';
            clearUploadInput();
            pageReload();
        };

        fileReader.readAsDataURL(file);
    }
}

