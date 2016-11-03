card.js用于简化动态生成网页时的代码编写过程。  
主要部分详见 `src/lib/card.js` 及 `src/serv.php`   
使用方法详见示例 `example.html` 及 `example.js`  
  
效果图：  
![example.html效果图][1]  
  
###详情  
  
通常一个网页可以划分成不同的部分，每个部分都有自己的事件响应函数。  
从零开始手工编写要考虑不同部分的id分配，事件绑定以及删除解绑问题。  
card.js的设计目的就是简化这些工作。  
它将网页每个部分看成一个“卡片”，通过调用card.js里的CARD对象创建及绑定事件。  
多个CARD可以集合成一个PAGE，然后通过PANEL实现多个PAGE之间动态切换。  
（PANEL可以类比看成网页的导航栏）  
  
###card.js组成部分  
cjs.f 通用小函数  
cjs.CARD 生成网页中的各个"卡片"  
cjs.PAGE 将多个“卡片”整合开成一个“页”  
cjs.PANEL 将多个“页”整合成“面板”，并实现动态切换  
cjs.o 存放各通过card.js制作出来的对象，供PAGE及PANEL调用。

###示例    
一个简单的“卡片”大概长这样子：  
```js
// src/js/eg.js

// 创建cardjs实例。
var eg = cardjs.cNew();

eg.o.simple_card = {
    cNew: function (container_id) {

        // 创建cjs.CARD实例。
        var scard = eg.CARD.cNew(container_id);

        // 生成界面代码
        scard.gen_html = function () {
            return '<div>这是一个简单的卡片示例</div>';
        };

        // 生成实例后立即显示出来。  
        scard.show();
        return scard;
    }
};
```
在html文件中调用上面的“卡片”：  
```html
<html>
    <head>
        <title>eg</title>
        <meta charset="utf-8">
        <script type="text/javascript" src="lib/card.js"></script>
        <script type="text/javascript" src="js/eg.js"></script>
    </head>
    <body>
        <div id="my_card" ></div>
        <script>
            var sc = eg.o.simple_card.cNew('my_card');
        </script>
    </body>
</html>
```
这么多代码就显示一行字也太麻烦了对吧？  
但有了上面的工作后动态切换多个“卡片”就很简单： 
```js
eg.o.my_panel = {
    cNew: function (container_id) {
        var mp = eg.PANEL.cNew(container_id, [
            ['三个卡片', ['simple_card','simple_card','simple_card']],
            ['单个卡片', ['simple_card']]);
        mp.show();
        mp.show_page(1);
        return mp;
    }
};
```
上面这个例子很无聊，只是不断的显示“这是一个 ...”。  
更详细的例子请看src里的example  

###协议  
GPLv3  
  
  [1]: https://raw.githubusercontent.com/jjling2011/card.js/master/readme/example_html.png
