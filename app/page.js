'use client'
import React from 'react'
import Image from 'next/image'
import { useState } from 'react'

const Page = () => {
  const [prompt, setPrompt] = useState('')
  const [image, setImage] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsGenerating(true)
    setError(null)
    
    try {
      // Load the base workflow
      const baseWorkflow = {
        "6": {
          "inputs": {
            "text": prompt,
            "clip": ["11", 0]
          },
          "class_type": "CLIPTextEncode",
          "_meta": {
            "title": "CLIP Text Encode (Positive Prompt)"
          }
        },
        "8": {
          "inputs": {
            "samples": ["13", 0],
            "vae": ["10", 0]
          },
          "class_type": "VAEDecode",
          "_meta": {
            "title": "VAE Decode"
          }
        },
        "9": {
          "inputs": {
            "filename_prefix": "ComfyUI",
            "images": ["8", 0]
          },
          "class_type": "SaveImage",
          "_meta": {
            "title": "Save Image"
          }
        },
        "10": {
          "inputs": {
            "vae_name": "ae.safetensors"
          },
          "class_type": "VAELoader",
          "_meta": {
            "title": "Load VAE"
          }
        },
        "11": {
          "inputs": {
            "clip_name1": "t5xxl_fp8_e4m3fn.safetensors",
            "clip_name2": "clip_l.safetensors",
            "type": "flux",
            "device": "default"
          },
          "class_type": "DualCLIPLoader",
          "_meta": {
            "title": "DualCLIPLoader"
          }
        },
        "12": {
          "inputs": {
            "unet_name": "flux1-dev.safetensors",
            "weight_dtype": "default"
          },
          "class_type": "UNETLoader",
          "_meta": {
            "title": "Load Diffusion Model"
          }
        },
        "13": {
          "inputs": {
            "noise": ["25", 0],
            "guider": ["22", 0],
            "sampler": ["16", 0],
            "sigmas": ["17", 0],
            "latent_image": ["27", 0]
          },
          "class_type": "SamplerCustomAdvanced",
          "_meta": {
            "title": "SamplerCustomAdvanced"
          }
        },
        "16": {
          "inputs": {
            "sampler_name": "euler"
          },
          "class_type": "KSamplerSelect",
          "_meta": {
            "title": "KSamplerSelect"
          }
        },
        "17": {
          "inputs": {
            "scheduler": "simple",
            "steps": 20,
            "denoise": 1,
            "model": ["30", 0]
          },
          "class_type": "BasicScheduler",
          "_meta": {
            "title": "BasicScheduler"
          }
        },
        "22": {
          "inputs": {
            "model": ["30", 0],
            "conditioning": ["26", 0]
          },
          "class_type": "BasicGuider",
          "_meta": {
            "title": "BasicGuider"
          }
        },
        "25": {
          "inputs": {
            "noise_seed": Math.floor(Math.random() * 1000000)
          },
          "class_type": "RandomNoise",
          "_meta": {
            "title": "RandomNoise"
          }
        },
        "26": {
          "inputs": {
            "guidance": 3.5,
            "conditioning": ["6", 0]
          },
          "class_type": "FluxGuidance",
          "_meta": {
            "title": "FluxGuidance"
          }
        },
        "27": {
          "inputs": {
            "width": 1024,
            "height": 1024,
            "batch_size": 1
          },
          "class_type": "EmptySD3LatentImage",
          "_meta": {
            "title": "EmptySD3LatentImage"
          }
        },
        "30": {
          "inputs": {
            "max_shift": 1.15,
            "base_shift": 0.5,
            "width": 1024,
            "height": 1024,
            "model": ["12", 0]
          },
          "class_type": "ModelSamplingFlux",
          "_meta": {
            "title": "ModelSamplingFlux"
          }
        }
      }

      // Submit workflow to ComfyUI
      const response = await fetch('/api/comfyui/prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: baseWorkflow })
      });

      const data = await response.json();
      const promptId = data.prompt_id;

      // Poll for completion
      let completed = false;
      while (!completed) {
        const statusResponse = await fetch(`/api/comfyui/history/${promptId}`);
        const statusData = await statusResponse.json();
        
        if (statusData[promptId]?.outputs?.[9]?.images?.[0]) {
          const imageData = statusData[promptId].outputs[9].images[0];
          setImage(`/api/comfyui/view?filename=${imageData.filename}&subfolder=${imageData.subfolder}`);
          completed = true;
        } else {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before next poll
        }
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0F172A] to-[#1E293B] text-white p-4 sm:p-8">
      {/* Header with Logo */}
      <header className="flex items-center space-x-3 sm:space-x-4 mb-8 sm:mb-12">
        <Image
          src="/favicon.png"
          alt="Eden AI Logo"
          width={32}
          height={32}
          className="rounded-lg sm:w-10 sm:h-10"
        />
        <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-[#187ADB] to-[#4CAF50] bg-clip-text text-transparent">
          Eden AI Image Generator
        </h1>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
        {/* Prompt Input Section */}
        <div className="bg-[#1E293B]/50 p-4 sm:p-6 rounded-xl backdrop-blur-sm border border-[#187ADB]/20">
          <div className="flex flex-col space-y-3 sm:space-y-4">
            <label htmlFor="prompt" className="text-base sm:text-lg font-medium text-[#187ADB]">
              Enter your prompt
            </label>
            <textarea
              id="prompt"
              className="w-full h-24 sm:h-32 px-3 sm:px-4 py-2 sm:py-3 bg-[#0F172A]/50 rounded-lg border border-[#187ADB]/30 focus:border-[#187ADB] focus:ring-2 focus:ring-[#187ADB] focus:outline-none text-white placeholder-gray-400 resize-none text-sm sm:text-base"
              placeholder="Describe the image you want to generate..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <button 
              onClick={handleSubmit} 
              disabled={isGenerating}
              className="self-end px-4 sm:px-6 py-2 bg-gradient-to-r from-[#187ADB] to-[#4CAF50] rounded-lg font-medium hover:from-[#1565C0] hover:to-[#388E3C] transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#187ADB] focus:ring-offset-2 focus:ring-offset-[#0F172A] disabled:opacity-70 disabled:cursor-not-allowed flex items-center space-x-2 text-sm sm:text-base"
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Generating...</span>
                </>
              ) : (
                'Generate Image'
              )}
            </button>
          </div>
        </div>

        {/* Results Container */}
        <div className="bg-[#1E293B]/50 p-4 sm:p-6 rounded-xl backdrop-blur-sm border border-[#187ADB]/20 min-h-[300px] sm:min-h-[400px] flex items-center justify-center">
          {isGenerating ? (
            <div className="text-center">
              <div className="flex justify-center mb-3 sm:mb-4">
                <svg className="animate-spin h-6 w-6 sm:h-8 sm:w-8 text-[#187ADB]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <p className="text-base sm:text-lg text-[#187ADB] font-medium">Generating your image...</p>
              <p className="text-xs sm:text-sm text-gray-400 mt-1 sm:mt-2">This may take a few moments</p>
            </div>
          ) : image ? (
            <img src={image} alt="Generated image" className="w-full h-auto rounded-lg max-h-[500px] object-contain" />
          ) : (
            <div className="text-center text-gray-400 px-4">
              <p className="text-base sm:text-lg">Your generated image will appear here</p>
              <p className="text-xs sm:text-sm mt-1 sm:mt-2">Enter a prompt and click generate to create your image</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

export default Page