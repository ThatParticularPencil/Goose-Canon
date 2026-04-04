import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'

import { useTheme } from '@/context/ThemeContext'
import { cn } from '@/lib/utils'

type DottedSurfaceProps = Omit<React.ComponentProps<'div'>, 'ref'>

export function DottedSurface({ className, ...props }: DottedSurfaceProps) {
  const { dark } = useTheme()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const SEPARATION = 120
    const AMOUNTX = 34
    const AMOUNTY = 52

    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(dark ? 0x0d0b10 : 0xfcf9f1, 1800, 7200)

    const camera = new THREE.PerspectiveCamera(60, 1, 1, 10000)
    camera.position.set(0, 335, 1180)
    camera.lookAt(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    })

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8))
    renderer.setClearColor(dark ? 0x0d0b10 : 0xfcf9f1, 0)
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    renderer.domElement.style.pointerEvents = 'none'
    container.appendChild(renderer.domElement)

    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(AMOUNTX * AMOUNTY * 3)
    const colors = new Float32Array(AMOUNTX * AMOUNTY * 3)
    const baseX = new Float32Array(AMOUNTX * AMOUNTY)
    const baseZ = new Float32Array(AMOUNTX * AMOUNTY)

    const darkBase = new THREE.Color('#d6d0c5')
    const lightBase = new THREE.Color('#314155')
    const accent = new THREE.Color('#4ade80')
    const warm = new THREE.Color('#f97316')

    let index = 0
    for (let ix = 0; ix < AMOUNTX; ix++) {
      for (let iy = 0; iy < AMOUNTY; iy++) {
        const x = ix * SEPARATION - (AMOUNTX * SEPARATION) / 2
        const z = iy * SEPARATION - (AMOUNTY * SEPARATION) / 2

        positions[index * 3] = x
        positions[index * 3 + 1] = 0
        positions[index * 3 + 2] = z

        baseX[index] = x
        baseZ[index] = z

        const baseColor = (dark ? darkBase : lightBase).clone()
        const mix = (ix / AMOUNTX) * 0.4 + (iy / AMOUNTY) * 0.2
        baseColor.lerp(ix > AMOUNTX * 0.55 ? warm : accent, mix * 0.35)

        colors[index * 3] = baseColor.r
        colors[index * 3 + 1] = baseColor.g
        colors[index * 3 + 2] = baseColor.b
        index++
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const material = new THREE.PointsMaterial({
      size: dark ? 7 : 6,
      vertexColors: true,
      transparent: true,
      opacity: dark ? 0.9 : 0.72,
      sizeAttenuation: true,
      depthWrite: false,
    })

    const points = new THREE.Points(geometry, material)
    scene.add(points)

    const pointer = {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      active: false,
      influence: 0,
    }

    const resize = () => {
      const width = container.clientWidth || window.innerWidth
      const height = container.clientHeight || window.innerHeight
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height, false)
    }

    const onPointerMove = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect()
      pointer.targetX = ((event.clientX - rect.left) / rect.width - 0.5) * 2
      pointer.targetY = ((event.clientY - rect.top) / rect.height - 0.5) * 2
      pointer.active = true
    }

    const onPointerLeave = () => {
      pointer.active = false
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerleave', onPointerLeave)

    let frameId = 0
    let count = 0

    const animate = () => {
      frameId = window.requestAnimationFrame(animate)

      pointer.x += (pointer.targetX - pointer.x) * 0.06
      pointer.y += (pointer.targetY - pointer.y) * 0.06
      pointer.influence += ((pointer.active ? 1 : 0) - pointer.influence) * 0.05

      const attribute = geometry.attributes.position as THREE.BufferAttribute
      const array = attribute.array as Float32Array

      let i = 0
      for (let ix = 0; ix < AMOUNTX; ix++) {
        for (let iy = 0; iy < AMOUNTY; iy++) {
          const idx = i * 3
          const baseWave =
            Math.sin((ix + count) * 0.24) * 22 +
            Math.cos((iy + count) * 0.34) * 18

          const nx = baseX[i] / ((AMOUNTX * SEPARATION) / 2)
          const nz = baseZ[i] / ((AMOUNTY * SEPARATION) / 2)
          const dx = nx - pointer.x * 0.86
          const dz = nz - pointer.y * 0.86
          const distance = Math.sqrt(dx * dx + dz * dz)
          const ripple = Math.max(0, 1 - distance * 1.6)
          const lift = Math.sin(count * 1.8 - distance * 8) * ripple * 34 * pointer.influence

          array[idx + 1] = baseWave + lift
          i++
        }
      }

      attribute.needsUpdate = true
      renderer.render(scene, camera)
      count += 0.028
    }

    animate()

    return () => {
      window.cancelAnimationFrame(frameId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerleave', onPointerLeave)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [dark])

  return (
    <div
      ref={containerRef}
      className={cn('pointer-events-none fixed inset-0 -z-10 overflow-hidden', className)}
      {...props}
    />
  )
}
