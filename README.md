# Ripples3

Liquid code experiment

[Demo](https://nicopowa.github.io/ripples3)

## Experiment n°122 / Liquid brain

### Changelog

- Smooth trails
- Sun is shining
- Added presets
- And sharing ([soft blur test](https://nicopowa.github.io/ripples3/#wsp=0.997&dmp=0.995&pgs=8&rft=0.57&tnt=0.02&sps=4.57&rgs=0.16&wth=0.58&fre=0.7&frp=0.35&frr=0.3&blr=2&dst=6&skh=0.62&dpt=0.84&sct=0.27&env=1.7&trd=0.025&tmp=0.42&ttr=0.35&tsp=1.65&css=0.62&csc=0.5&csp=1.31&csb=0.16&csd=3&sun=7.2&lht=0.5&rfs=0.06&rfm=0&rfv=0.15&sth=0.1&sph=0.35&lth=0.65&lph=0.3))
- Live params (hold + swipe left / right)
- Perf monitor
- Auto scale
- PWA install
- Messy code

### Menu

- about : it
- flow : play/pause simulation
- reset : reset water state
- upscl : render upscale
- copy : create & copy URL with current parameters
- 12345 : 
- point : autotouch point
- rain : is it raining ?
- swirl : effect
- previous / next preset
- parameters

### Perf

- Render is initially set to 2.0 and will decrease if framerate is too low.
- It can work the other way around, start low and then progressive upscale. 
- See settings in Liquid constructor.

### Tests

framerate x render

- Intel Iris Xe : 60fps x 2
- iPhone 12 Mini : 60fps x 3
- Oppo A16s : 60fps x 1
- Samsung S10+ : 60fps x 3.5
- iPad Pro 12" Gen2 : 60fps x 1.5
- Samsung Tab S7+ : 75~100fps x 2.125 (whoa o_O)

### Bugs

- Water & sky color
- Still water heavy CPU load
- Params pointer capture on Android

## Experiment n°64 / Be water

[Here](https://nicopowa.github.io/ripples3/index64.html)

## Soon

- Optimize JS & shaders
- Clean code
- Comments
- Docs
- Better minify JS & shaders
- Gyro control
- Service worker offline PWA
- Animated background
- Koi fish ? Sharks ?
- Multi screen :)

## Vanilla

Javascript + WebGL, compiled & minified with [ClosureCompiler](https://developers.google.com/closure/compiler) / [ShaderMinifier](https://ctrl-alt-test.fr/minifier/) / [Sass](https://sass-lang.com/)