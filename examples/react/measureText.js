const canvas = document.createElement('canvas')
const context = canvas.getContext && canvas.getContext('2d');
let measureText;
if (context) {

  measureText = (font, text) => {
    context.font = font;
    return context.measureText(text).width;
  }

} else {

  const ruler = document.createElement('div');
  ruler.style.visibility = 'hidden';
  ruler.style.position = 'absolute';
  ruler.style.top = '-8000px';
  ruler.style.width = 'auto';
  ruler.style.display = 'inline';
  ruler.style.left = '-8000px';
  ruler.appendChild(document.createTextNode(''));
  document.body.appendChild(ruler);

  measureText = (font, text) => {
    ruler.style.font = font;
    ruler.childNodes[0].nodeValue = text;
    return ruler.offsetWidth;
  }

}

export default measureText;
