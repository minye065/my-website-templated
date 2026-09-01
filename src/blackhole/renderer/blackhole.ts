import { DEFAULTS, type Params } from "./params";
import { vertexShader, fragmentShader } from './shader'

export class BlackHoleRenderer
{

	private canvas: HTMLCanvasElement;
	private gl: WebGL2RenderingContext;
	private shaderProgram: WebGLProgram;
	private pparams: Params;
	private arrayIndex: GLint;
	private vertexArray: WebGLVertexArrayObject;
	private buffer: WebGLBuffer;
	private cache: Record<string, WebGLUniformLocation | null> = {};
	private lastTime: number = performance.now();
	private requestAnimFrameID:number = 0;
	private elapsed: number = 0;
	private frame: number = 0;
	private spinPhase: number = 0;

	private cacheLocations()
	{
		this.cache["resolution"] = this.gl.getUniformLocation(this.shaderProgram, "resolution");
		this.cache["time"] = this.gl.getUniformLocation(this.shaderProgram, "time");
		this.cache["frame"] = this.gl.getUniformLocation(this.shaderProgram, "frame");
		this.cache["hue"] = this.gl.getUniformLocation(this.shaderProgram, "hue");
		this.cache["saturation"] = this.gl.getUniformLocation(this.shaderProgram, "saturation");
		this.cache["drift"] = this.gl.getUniformLocation(this.shaderProgram, "drift");
		this.cache["exposure"] = this.gl.getUniformLocation(this.shaderProgram, "exposure");
		this.cache["contrast"] = this.gl.getUniformLocation(this.shaderProgram, "contrast");
		this.cache["innerRadius"] = this.gl.getUniformLocation(this.shaderProgram, "innerRadius");
		this.cache["outerRadius"] = this.gl.getUniformLocation(this.shaderProgram, "outerRadius");
		this.cache["spin"] = this.gl.getUniformLocation(this.shaderProgram, "spin");
		this.cache["density"] = this.gl.getUniformLocation(this.shaderProgram, "density");
		this.cache["detail"] = this.gl.getUniformLocation(this.shaderProgram, "detail");
		this.cache["doppler"] = this.gl.getUniformLocation(this.shaderProgram, "doppler");
		this.cache["diskGlow"] = this.gl.getUniformLocation(this.shaderProgram, "diskGlow");
		this.cache["inclination"] = this.gl.getUniformLocation(this.shaderProgram, "inclination");
		this.cache["azimuth"] = this.gl.getUniformLocation(this.shaderProgram, "azimuth");
		this.cache["distance"] = this.gl.getUniformLocation(this.shaderProgram, "distance");
		this.cache["roll"] = this.gl.getUniformLocation(this.shaderProgram, "roll");
		this.cache["focalLength"] = this.gl.getUniformLocation(this.shaderProgram, "fieldOfView");
		this.cache["starAmount"] = this.gl.getUniformLocation(this.shaderProgram, "starAmount");
		this.cache["starBrightness"] = this.gl.getUniformLocation(this.shaderProgram, "starBrightness");
		this.cache["nebulosity"] = this.gl.getUniformLocation(this.shaderProgram, "nebula");
		this.cache["steps"] = this.gl.getUniformLocation(this.shaderProgram, "steps");
		this.cache["stepScale"] = this.gl.getUniformLocation(this.shaderProgram, "stepScale");
	}

	setParams(params: Params)
	{
		const DEG = Math.PI / 180;
		this.gl.useProgram(this.shaderProgram);

		this.gl.uniform1f(this.cache["hue"], (((params.hue % 360) + 360) % 360) / 360);
		this.gl.uniform1f(this.cache["saturation"], params.saturation);
		this.gl.uniform1f(this.cache["drift"], params.drift / 360);
		this.gl.uniform1f(this.cache["exposure"], params.exposure);
		this.gl.uniform1f(this.cache["contrast"], params.contrast);
		this.gl.uniform1f(this.cache["innerRadius"], params.innerRadius);
		this.gl.uniform1f(this.cache["outerRadius"], Math.max(params.outerRadius, params.innerRadius + 0.5));
		this.gl.uniform1f(this.cache["spin"], params.spin);
		this.gl.uniform1f(this.cache["density"], params.density);
		this.gl.uniform1f(this.cache["detail"], params.detail);
		this.gl.uniform1f(this.cache["doppler"], params.doppler);
		this.gl.uniform1f(this.cache["diskGlow"], params.diskGlow);
		this.gl.uniform1f(this.cache["inclination"], params.inclination * DEG);
		this.gl.uniform1f(this.cache["distance"], params.distance);
		this.gl.uniform1f(this.cache["roll"], params.roll * DEG);
		this.gl.uniform1f(this.cache["focalLength"], params.focalLength);
		this.gl.uniform1f(this.cache["starAmount"], params.starAmount);
		this.gl.uniform1f(this.cache["starBrightness"], params.starBrightness);
		this.gl.uniform1f(this.cache["nebulosity"], params.nebulosity);
		this.gl.uniform1f(this.cache["steps"], Math.round(110 + params.quality * 260));
		this.gl.uniform1f(this.cache["stepScale"], 1.35 - params.quality * 0.65);
	}

	private resize = () =>
	{
		this.canvas.width = this.canvas.clientWidth;
		this.canvas.height = this.canvas.clientHeight;
		this.gl.useProgram(this.shaderProgram);
		this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
		this.gl.uniform2f(this.cache["resolution"], this.canvas.width, this.canvas.height);
	}

	private frameUpdate = () =>
	{
		let currentIterationTime = performance.now();
		let deltaTime = (currentIterationTime - this.lastTime) / 1000;
		this.elapsed += deltaTime;
		this.gl.uniform1f(this.cache["time"], this.elapsed);
		this.lastTime = currentIterationTime;
		this.frame += 1;
		this.gl.useProgram(this.shaderProgram);
		this.gl.uniform1f(this.cache["frame"], this.frame % 64);
		if(this.pparams.autoRotate != 0)
		{
			this.spinPhase += deltaTime * this.pparams.autoRotate * 2.2 * (Math.PI / 180);
		}
		this.gl.uniform1f(this.cache["azimuth"], this.pparams.azimuth * (Math.PI / 180) + this.spinPhase);
		this.gl.bindVertexArray(this.vertexArray);
		this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
		this.gl.bindVertexArray(null);
		requestAnimationFrame(this.frameUpdate);
	}

	dispose()
	{
		cancelAnimationFrame(this.requestAnimFrameID);
		window.removeEventListener("resize", this.resize)
	}
	
	constructor(canvas: HTMLCanvasElement, params: Params)
	{
		window.addEventListener("resize", this.resize.bind(this));
		this.canvas = canvas;
		this.pparams = params;
		const gl = canvas.getContext("webgl2");
		if(gl == null)
		{
			throw new Error("failed to get context for webgl2");
		}
		this.gl = gl;

		let vshader = this.gl.createShader(this.gl.VERTEX_SHADER);
		let fshader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
		if(vshader == null || fshader == null)
		{
			throw new Error("failed to create shaders");
		}
		this.gl.shaderSource(vshader, vertexShader);
		this.gl.shaderSource(fshader, fragmentShader);
		this.gl.compileShader(vshader);
		this.gl.compileShader(fshader);
		if((this.gl.getShaderParameter(vshader, this.gl.COMPILE_STATUS) == false))
		{
			throw new Error(this.gl.getShaderInfoLog(vshader) + "shaders failed to compile");
		}
		else if((this.gl.getShaderParameter(fshader, this.gl.COMPILE_STATUS) == false))
		{
			throw new Error(this.gl.getShaderInfoLog(fshader) + "shaders failed to compile");
		}
		this.shaderProgram = this.gl.createProgram();
		this.gl.attachShader(this.shaderProgram, vshader);
		this.gl.attachShader(this.shaderProgram, fshader);
		this.gl.linkProgram(this.shaderProgram);
		this.cacheLocations();
		if(this.gl.getProgramParameter(this.shaderProgram, this.gl.LINK_STATUS) == false)
		{
			throw new Error(this.gl.getProgramInfoLog(this.shaderProgram) + "link status is false");
		}

		this.vertexArray = this.gl.createVertexArray();
		this.gl.bindVertexArray(this.vertexArray);
		this.buffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([-1, -1,  1, -1, -1, 1,  1, 1]), this.gl.STATIC_DRAW);
		this.arrayIndex = this.gl.getAttribLocation(this.shaderProgram, "aPos");
		this.gl.enableVertexAttribArray(this.arrayIndex);
		this.gl.vertexAttribPointer(this.arrayIndex, 2, this.gl.FLOAT, false, 0, 0);
		this.gl.bindVertexArray(null);
		this.resize();
		this.setParams(this.pparams);
		this.requestAnimFrameID = requestAnimationFrame(this.frameUpdate);
	}
}