card.js用于简化动态生成网页时的代码编写过程。  
主要部分详见 `src/lib/card.js` 及 `src/serv.php`   
使用方法详见示例 `example.html` 及 `example.js`  
  
### 实例 ###  
[card.js演示页面][1]  
*建议使用chrome浏览器*  
  
### 效果图 ###  
![example.html效果图][2]  
  
### 详情 ###  
  
通常一个网页可以划分成不同的部分，每个部分都有自己的事件响应函数。  
从零开始手工编写要考虑不同部分的id分配，事件绑定以及删除解绑问题。  
card.js的设计目的就是简化这些工作。  
它将网页每个部分看成一个“卡片”，通过调用card.js里的Card对象创建及绑定事件。  
多个Card集合成一个Page，然后通过Panel实现多个Page之间动态切换。  
（Panel可以类比看成浏览器的标签栏）  
    
### card.js导出对象 ###  
card.js默认导出 CardJS，包含以下四个对象  
CardJS.Lib 通用函数，可直接调用  
CardJS.Card 生成网页中的各个"卡片"  
CardJS.Page 将多个“卡片”整合开成一个“页”  
CardJS.Panel 将多个“页”整合成“面板”，并实现动态切换  
  
详细用法请看 example.html 及 example.js  
  
### 协议 ###   
GPLv3  
  


  [1]: https://jjling2011.github.io/card.js/src/example.html
  [2]: https://raw.githubusercontent.com/jjling2011/card.js/master/readme/example_html.png
