window.pointers = window.pointers ||
{
  run: new Set(),
  cache: new Map(),
  status: ''
};
window.pointers.record = (e, name, value) =>
{
  window.pointers.cache.set(e,
  {
    name,
    value
  });
};
window.pointers.setJS = function(code)
{
  chrome.runtime.sendMessage({method: 'set-js-custom', code});
};


function rcInitContent()
{
  if (window.pointers.status === '' || window.pointers.status === 'removed')
  {
    window.pointers.status = 'ready';
    for (const script of [...document.querySelectorAll('script.rightclickaddon')])
    {
      script.dispatchEvent(new Event('install'));
    }
    chrome.runtime.sendMessage(
    {
      method: 'rc-activate'
    });
    initRCMouseClick();
  }
  else
  {
    window.pointers.status = 'removed';
    chrome.runtime.sendMessage(
    {
      method: 'rc-release'
    });
    for (const c of window.pointers.run)
    {
      c();
    }
    window.pointers.run = new Set();
    for (const script of [...document.querySelectorAll('script.rightclickaddon')])
    {
      script.dispatchEvent(new Event('remove'));
    }
    for (const [e,
      {
        name,
        value
      }] of window.pointers.cache)
    {
      e.style[name] = value;
    }
    window.pointers.cache = new Set();
  }
};

function initRCMouseClick()
{
  /////////////////////////////////////////////////////////////////////////////////////////////////
  // user-select (sheet)
  {
    const clean = sheet =>
    {
      try
      {
        const check = rule =>
        {
          const
          {
            style
          } = rule;
          if (style['user-select'])
          {
            style['user-select'] = 'initial';
          }
        };
        const once = rule =>
        {
          if (rule.style)
          {
            check(rule);
          }
          else if (rule.cssRules)
          {
            for (const r of rule.cssRules)
            {
              once(r);
            }
          }
        };
        for (const rule of sheet.rules)
        {
          once(rule);
        }
      }
      catch (e)
      {}
    };
    const check = () =>
    {
      for (const sheet of document.styleSheets)
      {
        if (check.cache.has(sheet))
        {
          continue;
        }
        const node = sheet.ownerNode;
        if (node.tagName === 'STYLE' || node.tagName === 'LINK')
        {
          check.cache.set(sheet, true);
          clean(sheet);
        }
      }
    };
    check.cache = new WeakMap();
    const observer = new MutationObserver(ms =>
    {
      let update = false;
      for (const m of ms)
      {
        for (const node of m.addedNodes)
        {
          if (node.nodeType === Node.TEXT_NODE)
          {
            const
            {
              target
            } = m;
            if (target.tagName === 'STYLE')
            {
              update = true;
            }
          }
          else if (node.nodeType === Node.ELEMENT_NODE)
          {
            if (node.tagName === 'LINK' && node.rel === 'stylesheet')
            {
              node.addEventListener('load', () => check());
            }
            if (node.tagName === 'STYLE')
            {
              update = true;
            }
          }
        }
      }
      if (update)
      {
        check();
      }
    });
    observer.observe(document.documentElement,
    {
      subtree: true,
      childList: true
    });
    window.pointers.run.add(() => observer.disconnect());
    check();
  }
  // user-select (inline)
  {
    const observer = new MutationObserver(ms =>
    {
      ms.forEach(m =>
      {
        if (m.target)
        {
          if (m.target.style['user-select'])
          {
            window.pointers.record(m.target, 'user-select', m.target.style['user-select']);
            m.target.style['user-select'] = 'initial';
          }
        }
      });
    });
    observer.observe(document.documentElement,
    {
      attributes: true,
      subtree: true,
      attributeFilter: ['style']
    });
    window.pointers.run.add(() => observer.disconnect());
    [...document.querySelectorAll('[style]')].forEach(e =>
    {
      if (e.style['user-select'])
      {
        window.pointers.record(e, 'user-select', e.style['user-select']);
        e.style['user-select'] = 'initial';
      }
    });
  }
  // user-select (JS) [intrusive; enable on selected hostnames]
  window.pointers.setJS(`
    try
    {
      let active = true;
      Selection.prototype.removeAllRanges = new Proxy(Selection.prototype.removeAllRanges,
      {
        apply(target, self, args)
        {
          if (active)
          {
            return undefined;
          }
          return Reflect.apply(target, self, args);
        }
      });
      document.currentScript.addEventListener('remove', () => active = false);
      document.currentScript.addEventListener('install', () => active = true);
    }
    catch (e)
    {}
  `);
  /////////////////////////////////////////////////////////////////////////////////////////////////


  /////////////////////////////////////////////////////////////////////////////////////////////////
  // allow context-menu
  window.pointers.setJS(`
    try
    {
      const ogs = {
        removed: false,
        misc:
        {}
      };
      // alert
      ogs.misc.alert = window.alert;
      Object.defineProperty(window, 'alert',
      {
        get()
        {
          return ogs.removed ? ogs.misc.alert : (...args) => console.info('[alert is blocked]', ...args);
        },
        set(c)
        {
          ogs.misc.alert ||= c;
        }
      });
      // unblock contextmenu and more
      ogs.misc.mp = MouseEvent.prototype.preventDefault;
      Object.defineProperty(MouseEvent.prototype, 'preventDefault',
      {
        get()
        {
          return ogs.removed ? ogs.misc.mp : () =>
          {};
        },
        set(c)
        {
          console.info('a try to overwrite "preventDefault"', c);
          ogs.misc.mp ||= c;
        }
      });
      Object.defineProperty(MouseEvent.prototype, 'returnValue',
      {
        get()
        {
          return ogs.removed && 'v' in this ? this.v : true;
        },
        set(c)
        {
          console.info('a try to overwrite "returnValue"', c);
          this.v = c;
        }
      });
      ogs.misc.cp = ClipboardEvent.prototype.preventDefault;
      Object.defineProperty(ClipboardEvent.prototype, 'preventDefault',
      {
        get()
        {
          return ogs.removed ? ogs.misc.cp : () =>
          {};
        },
        set(c)
        {
          ogs.misc.cp ||= c;
        }
      });
      document.currentScript.addEventListener('remove', () => ogs.removed = true);
      document.currentScript.addEventListener('install', () => ogs.removed = false);
    }
    catch (e)
    {}
  `);


  {
    const rcSkipEvent = e => e.stopPropagation();
    // try to minimize exposure
    const rcKeyDownEvent = e =>
    {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && ['KeyC', 'KeyV', 'KeyP', 'KeyA'].includes(e.code))
      {
        e.stopPropagation();
      }
    };
    // bypass all registered listeners
    document.addEventListener('dragstart', rcSkipEvent, true);
    document.addEventListener('mousedown', rcSkipEvent, true);
    document.addEventListener('selectstart', rcSkipEvent, true);
    document.addEventListener('keydown', rcKeyDownEvent, true);
    document.addEventListener('cut', rcSkipEvent, true);
    document.addEventListener('paste', rcSkipEvent, true);
    document.addEventListener('copy', rcSkipEvent, true);
    document.addEventListener('contextmenu', rcSkipEvent, true);
    window.pointers.run.add(() =>
    {
      document.removeEventListener('dragstart', rcSkipEvent, true);
      document.removeEventListener('keydown', rcKeyDownEvent, true);
      document.removeEventListener('copy', rcSkipEvent, true);
      document.removeEventListener('selectstart', rcSkipEvent, true);
      document.removeEventListener('cut', rcSkipEvent, true);
      document.removeEventListener('paste', rcSkipEvent, true);
      document.removeEventListener('mousedown', rcSkipEvent, true);
      document.removeEventListener('contextmenu', rcSkipEvent, true);
    });
  }
  /////////////////////////////////////////////////////////////////////////////////////////////////


  /////////////////////////////////////////////////////////////////////////////////////////////////
  // custom styles
  {
    const rcCSSInit = () =>
    {
      const s = document.createElement('style');
      s.textContent = `
        .copy-protection-on #single-article-right,
        .copy-protection-on
        {
          pointer-events: initial !important;
        }

        ::-moz-selection
        {
          color: #000 !important;
          background: #accef7 !important;
        }

        ::selection
        {
          color: #000 !important;
          background: #accef7 !important;
        }

        @layer allow-right-click
        {
          ::-moz-selection
          {
            color: #000 !important;
            background: #accef7 !important;
          }

          ::selection
          {
            color: #000 !important;
            background: #accef7 !important;
          }
        }
      `;
      (document.head || document.body).appendChild(s);
      window.pointers.run.add(() => s.remove());
    };
    if (document.body)
    {
      rcCSSInit();
    }
    else
    {
      document.addEventListener('DOMContentLoaded', rcCSSInit);
    }
  }
  /////////////////////////////////////////////////////////////////////////////////////////////////


  /////////////////////////////////////////////////////////////////////////////////////////////////
  // find the correct element
  {
    let elements = [];
    const rcMouseEonwEvent = e =>
    {
      if (e.button !== 2)
      {
        return;
      }
      e.stopPropagation();
      // what if element is not clickable
      [...e.target.querySelectorAll('img,video')].forEach(e =>
      {
        e.style.setProperty('pointer-events', 'all', 'important');
      });
      const es = document.elementsFromPoint(e.clientX, e.clientY);
      const imgs = es.filter(e => e.src && e.tagName !== 'VIDEO');
      const vids = es.filter(e => e.src && e.tagName === 'VIDEO');
      const nlfy = e =>
      {
        elements.push(
        {
          e,
          val: e.style['pointer-events']
        });
        e.style['pointer-events'] = 'none';
        e.dataset.igblock = true;
      };
      if (imgs.length || vids.length)
      {
        for (const e of es)
        {
          if (vids.length ? vids.indexOf(e) !== -1 : imgs.indexOf(e) !== -1)
          {
            break;
          }
          else
          {
            nlfy(e);
          }
        }
      }
      setTimeout(() =>
      {
        for (const
          {
            e,
            val
          }
          of elements)
        {
          e.style['pointer-events'] = val;
          delete e.dataset.igblock;
        }
        elements = [];
      }, 300);
    };
    window.pointers.run.add(() =>
    {
      document.removeEventListener('mousedown', rcMouseEonwEvent, true);
    });
    document.addEventListener('mousedown', rcMouseEonwEvent, true);
  }
  /////////////////////////////////////////////////////////////////////////////////////////////////
}

if (window.top === window)
{
  rcInitContent();
}
else
{
  chrome.runtime.sendMessage(
  {
    method: 'rc-status'
  }, resp =>
  {
    if (resp === 'removed' && window.pointers.status === '')
    {
      window.pointers.status = 'ready';
    }
    rcInitContent();
  });
}

