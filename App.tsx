
import React, { useState, useCallback, useEffect } from 'react';
import {
  Upload,
  RefreshCcw,
  Download,
  Image as ImageIcon,
  RotateCcw,
  Maximize2,
  Cpu,
  X,
  Settings
} from 'lucide-react';
import { AppState, CameraSettings, ApiConfig } from './types';
import { getViewLabel, getAngleLabel, getShotLabel } from './constants';
import { CameraSphere } from './components/CameraSphere';

const CONFIG_STORAGE_KEY = 'camera_api_config';

const defaultConfig: ApiConfig = {
  baseUrl: 'https://generativelanguage.googleapis.com',
  apiKey: '',
  model: 'gemini-2.5-flash-image'
};

const App: React.FC = () => {
  const [config, setConfig] = useState<ApiConfig>(defaultConfig);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [state, setState] = useState<AppState>({
    referenceImage: null,
    resultImage: null,
    isGenerating: false,
    apiKeySelected: false,
    settings: {
      view: 45,
      angle: 20,
      shot: 80,
    }
  });

  // 从 localStorage 加载配置
  useEffect(() => {
    const savedConfig = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setConfig(parsed);
        setState(prev => ({ ...prev, apiKeySelected: parsed.apiKey }));
      } catch {
      }
    }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setState(prev => ({ ...prev, referenceImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const saveConfig = (newConfig: ApiConfig) => {
    setConfig(newConfig);
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(newConfig));
    setState(prev => ({ ...prev, apiKeySelected: newConfig.apiKey }));
  };

  const generateImage = async () => {
    if (!state.referenceImage) return;

    setState(prev => ({ ...prev, isGenerating: true }));

    try {
      const viewStr = getViewLabel(state.settings.view);
      const angleStr = getAngleLabel(state.settings.angle);
      const shotStr = getShotLabel(state.settings.shot);

      const prompt = `Re-generate this image from a new 3D camera perspective.
      Target Settings:
      - Perspective/View: ${viewStr}
      - Vertical Angle: ${angleStr}
      - Shot Type/Framing: ${shotStr}

      Constraint: Keep all subjects, colors, lighting, and environment identical. Change only the lens perspective and camera position to match these technical specifications precisely.`;

      const inputMimeType = state.referenceImage.split(';')[0].split(':')[1] || 'image/png';
      const base64Data = state.referenceImage.split(',')[1];

      const requestBody = {
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              { inline_data: { mime_type: inputMimeType, data: base64Data } }
            ]
          }
        ],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
          imageConfig: {
            aspectRatio: '9:16',
            imageSize: '1K'
          }
        }
      };

      const response = await fetch(`${config.baseUrl}/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.candidates?.[0]?.content?.parts) {
        for (const part of data.candidates[0].content.parts) {
          if (part.inlineData) {
            setState(prev => ({
              ...prev,
              resultImage: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
              isGenerating: false
            }));
            return;
          }
        }
      }

      setState(prev => ({ ...prev, isGenerating: false }));
    } catch (error: any) {
      console.error(error);
      alert(`生成失败: ${error.message}`);
      setState(prev => ({ ...prev, isGenerating: false }));
    }
  };

  const resetSettings = () => {
    setState(prev => ({
      ...prev,
      settings: { view: 45, angle: 20, shot: 80 }
    }));
  };

  const handleSphereChange = useCallback((view: number, angle: number) => {
    setState(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        view: Math.round(view),
        angle: Math.round(angle)
      }
    }));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 md:p-8">
      {/* Header */}
      <header className="w-full max-w-7xl flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowConfigModal(true)}
            className="bg-indigo-600 p-2 rounded-lg shadow-lg hover:bg-indigo-700 transition"
            title="API配置"
          >
            <Settings className="text-white" size={24} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">3D镜头控制器</h1>
            <p className="text-xs text-slate-500 uppercase tracking-widest">Interactive Lens Matrix v3.2</p>
          </div>
        </div>
        <div className="flex gap-4">
          {!state.apiKeySelected && (
            <div className="flex flex-col items-end gap-1">
              <button
                onClick={() => setShowConfigModal(true)}
                className="px-4 py-2 bg-rose-500 text-white rounded-full text-sm font-medium hover:bg-rose-600 transition shadow-md flex items-center gap-2"
              >
                <Cpu size={16} />
                请配置 API
              </button>
              <span className="text-[10px] text-slate-400">点击左上角配置按钮</span>
            </div>
          )}
          <button className="p-2 text-slate-400 hover:text-slate-600 transition" onClick={() => window.location.reload()}><RefreshCcw size={20} /></button>
          <button className="p-2 text-slate-400 hover:text-slate-600 transition" onClick={resetSettings}><RotateCcw size={20} /></button>
        </div>
      </header>

      {/* Config Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowConfigModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-800">API 配置</h2>
              <button onClick={() => setShowConfigModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">API 地址</label>
                <input
                  type="text"
                  value={config.baseUrl}
                  onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="https://generativelanguage.googleapis.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">API Key</label>
                <input
                  type="password"
                  value={config.apiKey}
                  onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="输入您的 API Key"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">模型</label>
                <input
                  type="text"
                  value={config.model}
                  onChange={(e) => setConfig({ ...config, model: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="gemini-2.5-flash-image"
                />
              </div>
              <button
                onClick={() => {
                  saveConfig(config);
                  setShowConfigModal(false);
                }}
                className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition"
              >
                保存配置
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <main className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Reference Image */}
        <section className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative group aspect-[9/16]">
            {state.referenceImage ? (
              <>
                <img 
                  src={state.referenceImage} 
                  alt="Reference" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full text-xs text-white font-medium">参考图</div>
                <button 
                  onClick={() => setState(prev => ({ ...prev, referenceImage: null }))}
                  className="absolute top-4 right-4 bg-white/90 p-2 rounded-full shadow-lg text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={16} />
                </button>
              </>
            ) : (
              <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl m-1">
                <Upload size={48} className="text-slate-300 mb-4" />
                <span className="text-slate-600 font-medium">点击或拖拽上传参考图</span>
                <span className="text-xs text-slate-400 mt-2">支持 JPG, PNG, WEBP</span>
                <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
              </label>
            )}
            <div className="absolute bottom-4 right-4 text-white opacity-40"><Maximize2 size={20} /></div>
          </div>
        </section>

        {/* Center: 3D Controller */}
        <section className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 flex flex-col gap-8">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-700">视角交互面板</span>
              <div className="flex gap-2 text-slate-300 text-[10px] items-center">
                <span>直接拖拽球体进行旋转</span>
              </div>
            </div>

            {/* The Sphere and Vertical Sliders Row */}
            <div className="grid grid-cols-12 items-center gap-4">
              {/* Angle Slider (Vertical) */}
              <div className="col-span-1 flex flex-col items-center h-48 justify-between py-4">
                <div className="text-[10px] text-slate-400 rotate-270 whitespace-nowrap -translate-y-4">角度</div>
                <input 
                  type="range" 
                  min="-90" 
                  max="90" 
                  value={state.settings.angle} 
                  onChange={(e) => setState(prev => ({ ...prev, settings: { ...prev.settings, angle: parseInt(e.target.value) } }))}
                  className="w-32 -rotate-90 appearance-none bg-slate-100 h-1.5 rounded-full accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Central Sphere */}
              <div className="col-span-10 flex flex-col items-center group">
                <CameraSphere 
                  view={state.settings.view} 
                  angle={state.settings.angle} 
                  onChange={handleSphereChange} 
                />
                {/* Horizontal Slider: View */}
                <div className="w-full mt-8 flex flex-col items-center gap-2">
                   <div className="text-[10px] text-slate-400">水平旋转 (360°)</div>
                   <input 
                    type="range" 
                    min="0" 
                    max="360" 
                    value={state.settings.view} 
                    onChange={(e) => setState(prev => ({ ...prev, settings: { ...prev.settings, view: parseInt(e.target.value) } }))}
                    className="w-full appearance-none bg-slate-100 h-1.5 rounded-full accent-blue-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Shot Slider (Vertical) */}
              <div className="col-span-1 flex flex-col items-center h-48 justify-between py-4">
                <div className="text-[10px] text-slate-400 rotate-90 whitespace-nowrap -translate-y-4">焦距</div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={state.settings.shot} 
                  onChange={(e) => setState(prev => ({ ...prev, settings: { ...prev.settings, shot: parseInt(e.target.value) } }))}
                  className="w-32 rotate-90 appearance-none bg-slate-100 h-1.5 rounded-full accent-orange-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Labels Readout */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-50 p-3 rounded-xl text-center border border-slate-100">
                   <div className="text-[10px] text-slate-400 uppercase">视角</div>
                   <div className="text-xs font-bold text-slate-700 mt-1">{getViewLabel(state.settings.view)}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl text-center border border-slate-100">
                   <div className="text-[10px] text-slate-400 uppercase">角度</div>
                   <div className="text-xs font-bold text-slate-700 mt-1">{getAngleLabel(state.settings.angle)}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl text-center border border-slate-100">
                   <div className="text-[10px] text-slate-400 uppercase">景别</div>
                   <div className="text-xs font-bold text-slate-700 mt-1">{getShotLabel(state.settings.shot)}</div>
                </div>
              </div>

              <button 
                onClick={generateImage}
                disabled={!state.referenceImage || state.isGenerating || !state.apiKeySelected}
                className={`w-full py-5 rounded-2xl flex flex-col items-center justify-center gap-1 font-bold transition-all shadow-xl ${
                  !state.referenceImage || state.isGenerating || !state.apiKeySelected
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98]'
                }`}
              >
                {state.isGenerating ? (
                  <>
                    <RefreshCcw size={20} className="animate-spin mb-1" />
                    <span className="text-sm">重塑空间透视...</span>
                  </>
                ) : (
                  <>
                    <span className="text-lg">应用镜头参数</span>
                    <span className="text-[10px] opacity-70 font-normal">GEMINI 3 PRO VISION ENGINE</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Right Side: Result Image */}
        <section className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative aspect-[9/16] flex items-center justify-center">
            {state.resultImage ? (
              <>
                <img 
                  src={state.resultImage} 
                  alt="Result" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4 bg-emerald-500 backdrop-blur-md px-3 py-1.5 rounded-full text-xs text-white font-medium">调整后</div>
                <div className="absolute top-4 right-4 flex gap-2">
                  <a 
                    href={state.resultImage} 
                    download="3d-perspective-output.png"
                    className="bg-white/90 p-2 rounded-full shadow-lg text-slate-600 hover:text-indigo-600 transition"
                  >
                    <Download size={16} />
                  </a>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 opacity-30 px-8 text-center">
                <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center border-2 border-dashed border-slate-200">
                  <ImageIcon size={32} className="text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-600 uppercase tracking-tighter">输出预览</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {state.isGenerating ? '正在渲染场景...' : '配置相机并点击生成'}
                  </p>
                </div>
              </div>
            )}
            <div className="absolute bottom-4 right-4 text-white opacity-40"><Maximize2 size={20} /></div>
          </div>
        </section>

      </main>

      {/* Background Decor */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-[800px] h-[800px] bg-indigo-50/50 rounded-full blur-[120px]"></div>
    </div>
  );
};

export default App;
