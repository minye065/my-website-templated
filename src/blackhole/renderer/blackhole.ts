import { type Params } from "./params";
import { vertexShader, fragmentShader } from './shader'
export class BlackHoleRenderer
{

	private canvas: HTMLCanvasElement;
	private gl: WebGL2RenderingContext;
	private shaderProgram: WebGLProgram;
	private pparams: Params;
	private vertexArray: WebGLVertexArrayObject;
	private buffer: WebGLBuffer;
	private cache: Record<string, WebGLUniformLocation | null> = {};
	private lastTime: number = performance.now();
	private requestAnimFrameID:number | null = null;
	private isActive = true;
	private isDisposed = false;
	private vertexShader: WebGLShader | null = null;
	private fragmentShader: WebGLShader | null = null;
	private elapsed: number = 0;
	private frame: number = 0;
	private spinPhase: number = 0;
	private pickFbo: WebGLFramebuffer | null = null;
	private pickRbo: WebGLRenderbuffer | null = null;
	private pickW = 0;
	private pickH = 0;
	private uclickPass: WebGLUniformLocation | null = null;


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
		this.cache["fieldOfView"] = this.gl.getUniformLocation(this.shaderProgram, "fieldOfView");
		this.cache["starAmount"] = this.gl.getUniformLocation(this.shaderProgram, "starAmount");
		this.cache["starBrightness"] = this.gl.getUniformLocation(this.shaderProgram, "starBrightness");
		this.cache["nebulosity"] = this.gl.getUniformLocation(this.shaderProgram, "nebulosity");
		this.cache["steps"] = this.gl.getUniformLocation(this.shaderProgram, "steps");
		this.cache["stepScale"] = this.gl.getUniformLocation(this.shaderProgram, "stepScale");
		this.cache["offsetX"] = this.gl.getUniformLocation(this.shaderProgram, "offsetX");
		this.cache["offsetY"] = this.gl.getUniformLocation(this.shaderProgram, "offsetY");
		this.uclickPass = this.gl.getUniformLocation(this.shaderProgram, "clickPass");
	}

	setParams(params: Params)
	{
		if(this.isDisposed) return;
		this.pparams = { ...params };
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
		this.gl.uniform1f(this.cache["fieldOfView"], params.fieldOfView);
		this.gl.uniform1f(this.cache["starAmount"], params.starAmount);
		this.gl.uniform1f(this.cache["starBrightness"], params.starBrightness);
		this.gl.uniform1f(this.cache["nebulosity"], params.nebulosity);
		this.gl.uniform1f(this.cache["steps"], Math.round(110 + params.quality * 260));
		this.gl.uniform1f(this.cache["stepScale"], 1.35 - params.quality * 0.65);
		this.gl.uniform1f(this.cache["offsetX"], params.offsetX);
		this.gl.uniform1f(this.cache["offsetY"], params.offsetY);
	}

	private resize = () =>
	{
		this.canvas.width = this.canvas.clientWidth;
		this.canvas.height = this.canvas.clientHeight;
		this.gl.useProgram(this.shaderProgram);
		this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
		this.gl.uniform2f(this.cache["resolution"], this.canvas.width, this.canvas.height);
	}

	private scheduleFrame = () =>
	{
		if(this.isDisposed || !this.isActive || this.requestAnimFrameID  !== null) return;
		this.requestAnimFrameID = requestAnimationFrame(this.frameUpdate);
	}

	private frameUpdate = () =>
	{
		this.requestAnimFrameID = null;
		if (this.isDisposed || !this.isActive || this.gl.isContextLost()) return;

		const currentIterationTime = performance.now();
		const deltaTime = Math.min(Math.max((currentIterationTime - this.lastTime) / 1000, 0), 0.05);
		this.elapsed += deltaTime;
		this.lastTime = currentIterationTime;

		this.gl.useProgram(this.shaderProgram);
		this.gl.uniform1f(this.cache["time"], this.elapsed);
		this.frame += 1;
		this.gl.uniform1f(this.cache["frame"], this.frame % 64);

		if(this.pparams.autoRotate !== 0)
		{
			this.spinPhase += deltaTime * this.pparams.autoRotate * 2.2 * (Math.PI / 180);
		}
		this.gl.uniform1f(this.cache["azimuth"], this.pparams.azimuth * (Math.PI / 180) + this.spinPhase);
		this.gl.uniform1f(this.uclickPass, 0);
		this.drawFullscreen();
		this.scheduleFrame();
	}
	private ensurePickTarget(): void
	{
		const gl = this.gl;
		const w = gl.drawingBufferWidth;
		const h = gl.drawingBufferHeight;
		if (this.pickFbo && w === this.pickW && h === this.pickH) return;

		if (!this.pickFbo)
		{
			this.pickFbo = gl.createFramebuffer();
			this.pickRbo = gl.createRenderbuffer();
		}
		gl.bindRenderbuffer(gl.RENDERBUFFER, this.pickRbo);
		gl.renderbufferStorage(gl.RENDERBUFFER, gl.RGBA8, w, h);
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.pickFbo);
		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, this.pickRbo);
		if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE)
		{
			console.warn('pick framebuffer incomplete');
		}
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.bindRenderbuffer(gl.RENDERBUFFER, null);
		this.pickW = w;
		this.pickH = h;
	}

	private drawFullscreen(): void
	{
		const gl = this.gl;
		gl.bindVertexArray(this.vertexArray);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
		gl.bindVertexArray(null);
	}
	setActive(active: boolean)
	{
		if (this.isDisposed || this.isActive === active) return;
		this.isActive = active;

		if (!active)
		{
			if (this.requestAnimFrameID !== null)
			{
				cancelAnimationFrame(this.requestAnimFrameID);
				this.requestAnimFrameID = null;
			}
			return;
		}

		this.lastTime = performance.now();
		this.resize();
		this.scheduleFrame();
	}


	dispose()
	{
		if (this.isDisposed) return;
		this.isDisposed = true;
		this.isActive = false;

		if (this.requestAnimFrameID !== null)
		{
			cancelAnimationFrame(this.requestAnimFrameID);
			this.requestAnimFrameID = null;
		}

		window.removeEventListener("resize", this.resize);

		this.gl.useProgram(null);
		this.gl.bindVertexArray(null);

		if (this.buffer) this.gl.deleteBuffer(this.buffer);
		if (this.vertexArray) this.gl.deleteVertexArray(this.vertexArray);
		if (this.vertexShader) this.gl.deleteShader(this.vertexShader);
		if (this.fragmentShader) this.gl.deleteShader(this.fragmentShader);
		if (this.shaderProgram) this.gl.deleteProgram(this.shaderProgram);
		if (this.pickFbo) this.gl.deleteFramebuffer(this.pickFbo);
		if (this.pickRbo) this.gl.deleteRenderbuffer(this.pickRbo);
		this.pickFbo = null;
		this.pickRbo = null;
	}
	
	constructor(canvas: HTMLCanvasElement, params: Params)
	{
		window.addEventListener("resize", this.resize);
		this.canvas = canvas;
		this.pparams = params;
		const gl = canvas.getContext("webgl2");
		if(gl === null)
		{
			throw new Error("failed to get context for webgl2");
		}
		this.gl = gl;

		const vshader = this.gl.createShader(this.gl.VERTEX_SHADER);
		const fshader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
		if(vshader === null || fshader === null)
		{
			throw new Error("failed to create shaders");
		}
		this.gl.shaderSource(vshader, vertexShader);
		this.gl.shaderSource(fshader, fragmentShader);
		this.gl.compileShader(vshader);
		this.gl.compileShader(fshader);
		this.vertexShader = vshader;
		this.fragmentShader = fshader;
		if(!this.gl.getShaderParameter(vshader, this.gl.COMPILE_STATUS))
		{
			throw new Error(this.gl.getShaderInfoLog(vshader) + "shaders failed to compile");
		}
		else if(!this.gl.getShaderParameter(fshader, this.gl.COMPILE_STATUS))
		{
			throw new Error(this.gl.getShaderInfoLog(fshader) + "shaders failed to compile");
		}
		this.shaderProgram = this.gl.createProgram();
		this.gl.attachShader(this.shaderProgram, vshader);
		this.gl.attachShader(this.shaderProgram, fshader);
		this.gl.linkProgram(this.shaderProgram);
		if(this.gl.getProgramParameter(this.shaderProgram, this.gl.LINK_STATUS) == false)
		{
			throw new Error(this.gl.getProgramInfoLog(this.shaderProgram) + "link status is false");
		}
		this.cacheLocations();
		this.vertexArray = this.gl.createVertexArray();
		this.gl.bindVertexArray(this.vertexArray);
		this.buffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([-1, -1,  1, -1, -1, 1,  1, 1]), this.gl.STATIC_DRAW);
		const arrayIndex = this.gl.getAttribLocation(this.shaderProgram, "aPos");
		this.gl.enableVertexAttribArray(arrayIndex);
		this.gl.vertexAttribPointer(arrayIndex, 2, this.gl.FLOAT, false, 0, 0);
		this.gl.bindVertexArray(null);
		this.resize();
		this.setParams(this.pparams);
		this.scheduleFrame();
	}
	screenClicked(inputX: number, inputY: number): boolean
	{
		const gl = this.gl;

		if (this.isDisposed || !this.isActive || gl.isContextLost())
		{
			return false;
		}
		const rect = this.canvas.getBoundingClientRect();
		if (rect.width <= 0 || rect.height <= 0 || !Number.isFinite(inputX) || !Number.isFinite(inputY) || inputX < 0 || inputX >= rect.width || inputY < 0 || inputY >= rect.height)
		{
			return false;
		}

		const w = gl.drawingBufferWidth;
		const h = gl.drawingBufferHeight;

		if (w <= 0 || h <= 0)
		{
			return false;
		}
		const pixelX = Math.min(w - 1, Math.floor((inputX / rect.width) * w));
		const pixelY = h - 1 - Math.min(h - 1, Math.floor((inputY / rect.height) * h));
		this.ensurePickTarget();
		const rgba = new Uint8Array(4);
		gl.useProgram(this.shaderProgram);
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.pickFbo);
		try
		{
			gl.viewport(0, 0, w, h);
			gl.enable(gl.SCISSOR_TEST);
			gl.scissor(pixelX, pixelY, 1, 1);
			gl.clearColor(0, 0, 0, 0);
			gl.clear(gl.COLOR_BUFFER_BIT);
			gl.uniform1f(this.uclickPass, 1);
			this.drawFullscreen();
			gl.readPixels(pixelX, pixelY, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, rgba );
		}
		finally
		{
			gl.uniform1f(this.uclickPass, 0);
			gl.disable(gl.SCISSOR_TEST);
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			gl.viewport(0, 0, w, h);
		}
		return rgba[0] > 127;
	}
}