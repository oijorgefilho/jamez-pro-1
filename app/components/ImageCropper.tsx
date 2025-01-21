import React, { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { Button } from '@/components/ui/button'

interface ImageCropperProps {
  image: string
  onCropFinish: (croppedImage: string) => void
  onCancel: () => void
}

const ImageCropper: React.FC<ImageCropperProps> = ({ image, onCropFinish, onCancel }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)

  const onCropChange = (crop: { x: number; y: number }) => {
    setCrop(crop)
  }

  const onZoomChange = (zoom: number) => {
    setZoom(zoom)
  }

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleCropFinish = async () => {
    try {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels)
      if (typeof croppedImage === 'string') {
        onCropFinish(croppedImage)
      } else {
        console.error('Imagem cortada inválida')
      }
    } catch (e) {
      console.error(e)
    }
  }

  const ColorfulButton: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({ onClick, children }) => (
    <button
      onClick={onClick}
      className="px-6 py-2 text-sm font-medium text-white rounded-full shadow-md transition-all duration-300 ease-in-out transform hover:scale-105 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 hover:from-purple-600 hover:via-pink-600 hover:to-red-600"
    >
      {children}
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1A1B1E] p-4 rounded-lg w-full max-w-md">
        <div className="relative h-64 mb-4">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropComplete}
          />
        </div>
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={onCancel}
            className="px-6 py-2 text-sm font-medium text-white rounded-full shadow-md transition-all duration-300 ease-in-out transform hover:scale-105 bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800"
          >
            Cancelar
          </button>
          <ColorfulButton onClick={handleCropFinish}>
            Selecionar
          </ColorfulButton>
        </div>
      </div>
    </div>
  )
}

export default ImageCropper

async function getCroppedImg(imageSrc: string, pixelCrop: any) {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    return null
  }

  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        console.error('Canvas is empty')
        return
      }
      resolve(URL.createObjectURL(blob))
    }, 'image/jpeg')
  })
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.src = url
  })
}

