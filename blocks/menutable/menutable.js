import { createOptimizedPicture, getMetadata } from '../../scripts/lib-franklin.js';

export default async function decorate(block) {
  const fetchData = async (url) => {
    let result = '';
    try {
      result = fetch(url)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`request to fetch ${url} failed with status code ${response.status}`);
          }
          return response.text();
        });
      return Promise.resolve(result);
    } catch (e) {
      throw new Error(`request to fetch ${url} failed with status code with error ${e}`);
    }
  };

  const getMenuItemsFromPOS = async () => {
    const linkPath = getMetadata('product-data-source');
    const docUrl = new URL(document.URL);
    const sheetLink = docUrl.origin + linkPath;
    const itemsMap = new Map();
    try {
      const sheetDataResponse = JSON.parse(await fetchData(sheetLink));
      if (!sheetDataResponse) {
        console.warn(`Invalid sheet Link ${sheetLink}.Skipping processing this one.`);
      }
      if (sheetDataResponse[':type'] === 'sheet') {
        const sheetData = sheetDataResponse.data;
        for (let row = 0; row < sheetData.length; row++) {
          const itemDetails = sheetData[row];
          const id = itemDetails.Id;
          itemsMap.set(id, itemDetails);
        }
      } else {
        throw new Error(`Invalid sheet type: ${sheetDataResponse[':type']}`);
      }
    } catch (err) {
      console.warn(`Error while processing sheet ${sheetLink}`, err);
    }
    return itemsMap;
  };

  const getSkuId = (content) => {
    if (content.includes('{{SKU') && content.includes('}}')
        && content.indexOf('{{') < content.indexOf('}}')) {
      return content.substring(content.indexOf('{{SKU') + 5, content.indexOf('.'));
    }
    return '';
  };

  const updatePlaceholder = (content, posItems) => {
    let result = content;
    const skuId = getSkuId(content);
    if (!posItems.has(skuId)) {
      return content;
    }
    const posItem = posItems.get(skuId);
    const keys = Object.keys(posItem);
    keys.forEach((key) => {
      const placeholder = `{{SKU${skuId}.${key}}}`;
      if (content.includes(placeholder)) {
        result = result.replace(placeholder, posItem[key]);
      }
    });
    return result;
  };

  const parseMenuItems = () => {
    const columns = block.children;
    const items = [];
    for (let i = 0; i < columns.length; i++) {
      const itemChildren = columns[i].children;
      const item = {};
      item.name = itemChildren[0].textContent;
      item.price = itemChildren[1].textContent;
      item.description = itemChildren[2].textContent;
      item.image = itemChildren[3].getElementsByTagName('img')[0].getAttribute('src');
      items.push(item);
    }
    return items;
  };

  const getMenuItems = async () => {
    const items = parseMenuItems();
    const posItems = await getMenuItemsFromPOS();
    const menuItemsContainer = document.createElement('div');
    menuItemsContainer.className = 'menu-items-container';

    items.forEach((item) => {
      const itemEle = document.createElement('div');
      itemEle.className = 'item';

      const nameDescEle = document.createElement('div');
      nameDescEle.className = 'name-desc';

      const nameEle = document.createElement('div');
      nameEle.textContent = updatePlaceholder(item.name, posItems);
      nameEle.className = 'name';

      const descEle = document.createElement('div');
      descEle.textContent = updatePlaceholder(item.description, posItems);
      descEle.className = 'description';

      nameDescEle.appendChild(nameEle);
      nameDescEle.appendChild(descEle);

      const priceContainer = document.createElement('div');
      priceContainer.className = 'price-container';
      const priceEle = document.createElement('div');
      priceEle.textContent = updatePlaceholder(item.price, posItems);
      priceEle.className = 'price';
      priceContainer.className = 'price-container';

      priceContainer.appendChild(priceEle);

      const imageEle = document.createElement('div');
      imageEle.className = 'image';
      const pictureEle = createOptimizedPicture(item.image, '', false, [{ width: '120' }]);
      imageEle.appendChild(pictureEle);

      itemEle.appendChild(nameDescEle);
      itemEle.appendChild(priceContainer);
      itemEle.appendChild(imageEle);

      menuItemsContainer.appendChild(itemEle);
    });

    return menuItemsContainer;
  };

  const getQRCode = () => {
    /* eslint-disable no-undef, no-unused-vars */
    const qrcode = new QRCode(document.getElementsByClassName('qrcode')[0], {
      text: document.URL, width: 90, height: 90, correctLevel: QRCode.CorrectLevel.H,
    });
  };

  const loadQRscript = (callback) => {
    const script = document.createElement('script');
    script.setAttribute('src', '/blocks/menutable/qrcode.min.js');
    script.onload = callback;
    document.head.appendChild(script);
  };

  const generateMenuTable = async () => {
    const title = getMetadata('og:title');
    const contacts = getMetadata('contact').split(',');
    const menuTitle = getMetadata('menu-title');
    const menuTableContainer = document.getElementById('menutable-container');
    const titleContactContainer = document.createElement('div');
    titleContactContainer.className = 'title-contact';
    const titleContainer = document.createElement('div');
    const titleElement = document.createElement('h2');
    titleContainer.className = 'title';
    titleElement.innerHTML = title;
    titleContainer.appendChild(titleElement);

    const contactContainer = document.createElement('div');
    contacts.forEach((contactDetail) => {
      const contactElement = document.createElement('div');
      contactElement.innerHTML = contactDetail;
      contactContainer.appendChild(contactElement);
    });

    contactContainer.className = 'contact';

    titleContactContainer.appendChild(titleContainer);
    titleContactContainer.appendChild(contactContainer);
    menuTableContainer.appendChild(titleContactContainer);

    const menuTitleElement = document.createElement('div');
    menuTitleElement.textContent = menuTitle;
    menuTitleElement.className = 'menu-title';
    menuTableContainer.appendChild(menuTitleElement);

    const menuItemsContainer = await getMenuItems();
    menuTableContainer.appendChild(menuItemsContainer);

    const QRCodeContainer = document.createElement('div');
    QRCodeContainer.className = 'qrcode-container';
    const QRCodeEle = document.createElement('div');
    QRCodeEle.className = 'qrcode';
    const QRCodeEleTitle = document.createElement('div');
    QRCodeEleTitle.className = 'qrcode-title';
    QRCodeEleTitle.textContent = 'Order Online';
    QRCodeContainer.appendChild(QRCodeEleTitle);
    QRCodeContainer.appendChild(QRCodeEle);

    menuTableContainer.appendChild(QRCodeContainer);
    loadQRscript(getQRCode);
  };

  const main = document.getElementsByTagName('main')[0];
  main.style.display = 'none';
  const menuTableContainer = document.createElement('div');
  menuTableContainer.id = 'menutable-container';
  document.body.style.backgroundImage = `url('${getMetadata('background')}')`;
  document.body.style.backgroundRepeat = 'no-repeat';
  document.body.style.backgroundPosition = 'center top';
  main.parentNode.insertBefore(menuTableContainer, main);
  await generateMenuTable();
}
