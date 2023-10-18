var right_click_register=-1;

window.addEventListener('message', function ( event )
{
  if (typeof(event.data.event) != 'undefined')
  {
    if (event.data.event == 'storage') 
      chrome.storage.local.set(event.data.storage) ; 
    try
    {
      chrome.runtime.sendMessage(event.data) ; 
    }
    catch (ex) {}
  }
});

chrome.runtime.sendMessage({event: 'register'}, function(response) 
{
  if (response)
  {
    right_click_register = response.status;
    chrome.storage.local.get(null, function (data)
    {
      if (JSON.stringify(data)!='{}'&& typeof(data.d_count) != 'undefined')
      {
        var right_click_script = document.createElement('script');
        right_click_script.setAttribute('src',chrome.runtime.getURL("/script/content_html.js"));
        right_click_script.onload = function()
        {
          window.postMessage({event: 'load', status: right_click_register, description: response.description, comment:response.comment, data: data, data_logo: chrome.runtime.getURL("/icons/active/368.png")});
        };
        document.head.appendChild(right_click_script);
        if (right_click_register==0)
        {
          chrome.storage.local.set({d_count:data.d_count+1});
        }
      }
      else
      {
        if (right_click_register==0)
        {
          chrome.storage.local.set({d_count:1});
        }
      }
    });
  }
});
