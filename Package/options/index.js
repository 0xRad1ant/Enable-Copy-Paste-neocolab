'use strict';

const toast = document.getElementById('toast');
const notify = msg =>
{
  clearTimeout(notify.id);
  toast.textContent = msg;
  notify.id = setTimeout(() => toast.textContent = '', 2000);
};

chrome.storage.local.get(
{
  'hostnames': []
}, prefs =>
{
  document.getElementById('whitelist').value = prefs.hostnames.join(', ');
});


document.getElementById('save').addEventListener('click', () =>
{
  const hostnames = document.getElementById('whitelist').value.split(/\s*,\s*/).map(s =>
  {
    s = s.trim();
    if (s && s.startsWith('http'))
    {
      try
      {
        return (new URL(s)).origin;
      }
      catch (e)
      {
        console.error(e);
        return '';
      }
    }
    return s;
  }).filter((s, i, l) => s && l.indexOf(s) === i);
  chrome.storage.local.set(
  {
    'monitor': hostnames.length > 0,
    hostnames
  });
  document.getElementById('whitelist').value = hostnames.join(', ');
  
  notify(chrome.i18n.getMessage('options_saved'));
});


// reset
document.getElementById('reset').addEventListener('click', e =>
{
  if (e.detail === 1)
  {
    notify(chrome.i18n.getMessage('options_click_reset'));
  }
  else
  {
    chrome.storage.local.set({'monitor': false, hostnames: []}, function() {chrome.runtime.reload();window.close();} );
  }
});
document.getElementById('whitelist').disabled = false;


/**
 * @param {string} msg "__MSG_Hello__para1,para2|1"  or "__MSG_Hello__para1,para2|0"
 * */
function convertMsgAsFuncPara(msg) {
  const match = /__MSG_(?<id>\w+)__(?<para>[^|]*)?(\|(?<escapeLt>[01]{1}))?/g.exec(msg) // https://regex101.com/r/OeXezc/1/
  if (match) {
    let {groups: {id, para, escapeLt}} = match
    para = para ?? ""
    escapeLt = escapeLt ?? false
    return [id, para.split(","), Boolean(Number(escapeLt))]
  }
  return [undefined]
}

function InitI18nNode() {
  const msgNodeArray = document.querySelectorAll(`[data-i18n]`)
  msgNodeArray.forEach(msgNode => {
    const [id, paraArray, escapeLt] = convertMsgAsFuncPara(msgNode.getAttribute("data-i18n"))
    if (id) {
      msgNode.innerHTML = chrome.i18n.getMessage(id, paraArray, {escapeLt})
    }

    // ↓ handle attr
    for (const attr of msgNode.attributes) {
      const [attrName, attrValue] = [attr.nodeName, attr.nodeValue]
      const [id, paraArray, escapeLt] = convertMsgAsFuncPara(attrValue)
      if (!id) {
        continue
      }
      msgNode.setAttribute(attrName, chrome.i18n.getMessage(id, paraArray, {escapeLt}))
    }
  })
}
(() => {
  window.addEventListener("load", InitI18nNode, {once: true})
})()
