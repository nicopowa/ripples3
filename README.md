# Ripples3

  
Liquid code experiment  
  

### [Demo](https://nicopowa.github.io/ripples3)

🌊 Liquid simulation  
🫠 Might liquify your CPU  
🪫 And melt your battery  

## Experiment n°166 — [Pool Party](https://nicopowa.github.io/ripples3/#img=pool.webp&wsp=0.997&dmp=0.99&pgs=10&rft=0.73&wth=0.49&tnt=0.395&sps=0.64&rgs=0.28&fre=0.2&frp=0.15&frr=4.1&blr=0.58&dst=13.2&skh=0.35&dpt=10.5&sct=0.51&env=1.98&trd=0.032&tmp=0.69&ttr=2.85&tsp=1.7&css=0.51&csc=0.9&csp=0.035&csb=0.15&csd=2.4&sun=0.3&sth=25&sph=24&lht=0.4&lth=0&lph=0&rfs=0&rfm=0&rfv=0)  

- Better physics
- Improved light
- Less CPU load
- Various fixes

[uncompiled dev version](https://nicopowa.github.io/ripples3/dev.html)

## What's next

- Optimize render loop
- Normalize parameters
- Adjust ranges & steps
- Rewrite trail spread
- Touch points params
- Gyro control
- Offline service worker
- Animated background
- Koi fish ? Sharks ?
- Multi screen !

## Menu

- about : soon
- flow : play/pause simulation
- reset : reset water state
- upscl : render upscale
- full : toggle fullscreen
- share : share URL with current parameters
- image : load image from device
- test : testing only
- {    } : 
- point : autotouch point
- rain : is it raining ?
- swirl : effect
- previous / next preset
- parameters sliders

## Bugs

- Still water heavy CPU load
- More bugs

## Presets

### [biohazard](https://nicopowa.github.io/ripples3/index152.html#wsp=0.997&dmp=0.99&pgs=10&rft=0.73&wth=0.49&tnt=0.395&sps=0.64&rgs=0.28&fre=0.2&frp=0.15&frr=4.1&blr=0.58&dst=13.2&skh=0.35&dpt=10.5&sct=0.51&env=1.98&trd=0.032&tmp=0.69&ttr=2.85&tsp=1.7&css=0.51&csc=0.9&csp=0.035&csb=0.15&csd=2.4&sun=0.3&sth=25&sph=24&lht=0.4&lth=0&lph=0&rfs=0&rfm=0&rfv=0)

### [bright light](https://nicopowa.github.io/ripples3/#wsp=0.997&dmp=0.995&pgs=13&rft=0.24&wth=0.58&tnt=0.035&sps=0.14&rgs=0.64&fre=2.2&frp=0.725&frr=0.3&blr=0.35&dst=3.6&skh=0.62&dpt=0.87&sct=0.28&env=0.73&trd=0.027&tmp=0.88&ttr=3.3&tsp=3.6&css=0.46&csc=0.3&csp=0&csb=0.42&csd=2.4&sun=1.2&sth=270&sph=19&lht=1.4&lth=105&lph=16&rfs=0.75&rfm=2.81&rfv=0.15)

### [smooth blur](https://nicopowa.github.io/ripples3/#wsp=0.997&dmp=0.995&pgs=8&rft=0.57&wth=0.58&tnt=0.02&sps=1.37&rgs=0.09&fre=0.7&frp=0.35&frr=0.3&blr=1.33&dst=6&skh=0.62&dpt=0.84&sct=0.27&env=1.7&trd=0.025&tmp=0.42&ttr=0.35&tsp=1.65&css=0.62&csc=0.5&csp=0&csb=0.16&csd=3&sun=7.2&sth=0.1&sph=44&lht=0.6&lth=110&lph=61&rfs=0.22&rfm=3.24&rfv=0.15) (very heavy)

## Previous experiments

### [n°152 — Biohazard](https://nicopowa.github.io/ripples3/index152.html) / [dev](https://nicopowa.github.io/ripples3/dev152.html)

### [n°122 — Liquid brain](https://nicopowa.github.io/ripples3/index122.html) / [dev](https://nicopowa.github.io/ripples3/dev122.html)

### [n°064 — Be water](https://nicopowa.github.io/ripples3/index64.html) / [dev](https://nicopowa.github.io/ripples3/dev64.html)

## Perf

- Render detail is initially set to 2.0 and will decrease if framerate is too low.
- It can work the other way around, start low and then progressive upscale.
- See settings in Liquid constructor.

## Tests (exp n°064)

framerate × render

- Intel Iris Xe : 60fps x 2
- iPhone 12 Mini : 60fps x 3
- Oppo A16s : 60fps x 1
- Samsung S10+ : 60fps x 3.5
- iPad Pro 12" Gen2 : 60fps x 1.5
- Samsung Tab S7+ : 75~100fps x 2.125 o_O

## Vanilla

Javascript + WebGL

[ClosureCompiler](https://developers.google.com/closure/compiler) / [ShaderMinifier](https://ctrl-alt-test.fr/minifier/) / [Sass](https://sass-lang.com/)