const data=JSON.parse(document.querySelector('#case-data').textContent);
const viewer=document.querySelector('.viewer');

if(viewer){
  viewer.innerHTML='';
  viewer.className='viewer vertical-gallery';

  data.images.forEach((slide,index)=>{
    const figure=document.createElement('figure');
    figure.className='gallery-item';

    const img=document.createElement('img');
    img.src=slide.src;
    img.width=slide.width;
    img.height=slide.height;
    img.alt=`${data.title}. Изображение ${index+1}`;
    img.decoding='async';

    if(index===0){
      img.loading='eager';
      img.fetchPriority='high';
    }else{
      img.loading='lazy';
      img.fetchPriority='low';
    }

    figure.appendChild(img);
    viewer.appendChild(figure);
  });
}
