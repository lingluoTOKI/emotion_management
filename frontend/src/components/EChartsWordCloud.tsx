'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Cloud, Info, Loader2 } from 'lucide-react'

// 词云数据接口
interface WordItem {
  text: string;
  value: number;
  category: string;
}

interface EChartsWordCloudProps {
  words: WordItem[];
  emotion?: string;
  width?: number;
  height?: number;
}

// 模拟ECharts词云效果的组件
export default function EChartsWordCloud({ 
  words, 
  emotion = 'neutral', 
  width = 800, 
  height = 400 
}: EChartsWordCloudProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [chartInstance, setChartInstance] = useState<any>(null)

  // 动态加载ECharts (避免SSR问题)
  useEffect(() => {
    const loadECharts = async () => {
      try {
        setIsLoading(true)
        
        // 动态导入ECharts
        const echarts = await import('echarts')
        
        // 尝试导入wordcloud插件
        let hasWordCloudPlugin = false;
        try {
          await import('echarts-wordcloud');
          hasWordCloudPlugin = true;
        } catch (error) {
          console.log('WordCloud plugin not available, using fallback');
        }

        if (chartRef.current) {
          const chart = echarts.init(chartRef.current)
          setChartInstance(chart)
          
          // 根据插件可用性选择配置
          const option = hasWordCloudPlugin 
            ? createWordCloudOption(words, emotion)
            : createFallbackDisplay(words, emotion)
          chart.setOption(option)
          
          // 响应式处理
          const handleResize = () => {
            chart.resize()
          }
          window.addEventListener('resize', handleResize)
          
          setIsLoading(false)
          
          return () => {
            window.removeEventListener('resize', handleResize)
            chart.dispose()
          }
        }
      } catch (error) {
        console.error('Failed to load ECharts:', error)
        setIsLoading(false)
      }
    }

    loadECharts()
  }, [words, emotion])

  // 真正的词云配置（需要wordcloud插件）
  const createWordCloudOption = (words: WordItem[], emotion: string) => {
    // 统一的系统配色方案
    const systemColors = {
      primary: ['#3B82F6', '#1D4ED8', '#1E40AF'], // 蓝色主色调
      secondary: ['#10B981', '#059669', '#047857'], // 绿色辅助色
      accent: ['#F59E0B', '#D97706', '#B45309'], // 橙色强调色
      purple: ['#8B5CF6', '#7C3AED', '#6D28D9'], // 紫色
      pink: ['#EC4899', '#DB2777', '#BE185D'], // 粉色
      indigo: ['#6366F1', '#4F46E5', '#4338CA'], // 靛色
      teal: ['#14B8A6', '#0D9488', '#0F766E'], // 青色
      slate: ['#64748B', '#475569', '#334155'] // 灰色
    };

    const emotionColorSets = {
      happy: [...systemColors.secondary, ...systemColors.teal, ...systemColors.primary],
      anxious: [...systemColors.accent, ...systemColors.pink, ...systemColors.purple],
      stress: [...systemColors.pink, ...systemColors.accent, ...systemColors.purple],
      love: [...systemColors.pink, ...systemColors.purple, ...systemColors.indigo],
      neutral: [...systemColors.primary, ...systemColors.secondary, ...systemColors.accent, ...systemColors.purple, ...systemColors.pink, ...systemColors.indigo, ...systemColors.teal]
    };
    
    const colors = emotionColorSets[emotion as keyof typeof emotionColorSets] || emotionColorSets.neutral;
    const maxValue = Math.max(...words.map(w => w.value));

    // 根据词频和类别分配颜色
    const data = words.map((word, index) => {
      // 为不同类别的词语选择不同的颜色区间
      const categoryColorIndex = {
        emotion: 0,
        academic: 2, 
        social: 4,
        physical: 6,
        family: 8,
        behavior: 1
      };
      
      const baseIndex = categoryColorIndex[word.category as keyof typeof categoryColorIndex] || 0;
      const colorIndex = (baseIndex + index) % colors.length;
      
      return {
        name: word.text,
        value: word.value,
        textStyle: {
          color: colors[colorIndex],
          fontWeight: 'bold',
          fontFamily: 'Microsoft YaHei, PingFang SC, SimHei, sans-serif'
        }
      }
    });

    return {
      tooltip: {
        formatter: function(params: any) {
          return `<div style="padding: 8px; background: rgba(0,0,0,0.8); border-radius: 4px; color: white;">
            <div style="font-weight: bold; margin-bottom: 4px;">${params.name}</div>
            <div style="color: #ccc;">出现次数: ${params.value}</div>
          </div>`
        },
        backgroundColor: 'transparent',
        borderWidth: 0
      },
      series: [{
        type: 'wordCloud',
        sizeRange: [16, 48],
        rotationRange: [-15, 15],
        rotationStep: 15,
        gridSize: 12,
        shape: 'circle',
        width: '95%',
        height: '90%',
        left: 'center',
        top: 'center',
        right: null,
        bottom: null,
        drawOutOfBound: false,
        layoutAnimation: true,
        textStyle: {
          fontFamily: 'Microsoft YaHei, PingFang SC, SimHei, sans-serif',
          fontWeight: 'bold'
        },
        emphasis: {
          focus: 'self',
          textStyle: {
            textShadowBlur: 10,
            textShadowColor: '#333'
          }
        },
        data: data
      }]
    }
  }

  // Fallback显示（当wordcloud插件不可用时）
  const createFallbackDisplay = (words: WordItem[], emotion: string) => {
    // 统一的系统配色方案
    const systemColors = {
      primary: ['#3B82F6', '#1D4ED8', '#1E40AF'],
      secondary: ['#10B981', '#059669', '#047857'],
      accent: ['#F59E0B', '#D97706', '#B45309'],
      purple: ['#8B5CF6', '#7C3AED', '#6D28D9'],
      pink: ['#EC4899', '#DB2777', '#BE185D'],
      indigo: ['#6366F1', '#4F46E5', '#4338CA'],
      teal: ['#14B8A6', '#0D9488', '#0F766E']
    };
    
    // 为每个词分配独特颜色
    const categoryColors = {
      emotion: systemColors.pink[0],
      academic: systemColors.primary[0], 
      social: systemColors.secondary[0],
      physical: systemColors.purple[0],
      family: systemColors.accent[0],
      behavior: systemColors.teal[0]
    };
    
    // 使用简单的柱状图展示
    return {
      tooltip: {
        trigger: 'axis',
        formatter: function(params: any) {
          return `<div style="padding: 8px;">
            <div style="font-weight: bold;">${params[0].name}</div>
            <div style="color: #666;">出现次数: ${params[0].value}</div>
          </div>`
        },
        backgroundColor: 'rgba(0,0,0,0.8)',
        borderWidth: 0,
        textStyle: {
          color: '#fff'
        }
      },
      xAxis: {
        type: 'category',
        data: words.map(w => w.text),
        axisLabel: {
          interval: 0,
          rotate: 45,
          fontSize: 11,
          fontWeight: 'bold',
          color: '#333'
        },
        axisLine: {
          lineStyle: {
            color: '#ddd'
          }
        }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          fontSize: 11,
          color: '#666'
        },
        axisLine: {
          lineStyle: {
            color: '#ddd'
          }
        },
        splitLine: {
          lineStyle: {
            color: '#f0f0f0'
          }
        }
      },
      series: [{
        type: 'bar',
        data: words.map((word, index) => ({
          value: word.value,
          itemStyle: {
            color: categoryColors[word.category as keyof typeof categoryColors] || '#3b82f6',
            borderRadius: [4, 4, 0, 0]
          }
        })),
        barWidth: '50%',
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0,0,0,0.3)'
          }
        }
      }]
    }
  }

  // 获取情绪名称
  const getEmotionName = (emotion: string) => {
    const names = {
      happy: "开心",
      anxious: "焦虑", 
      stress: "压力",
      love: "温暖",
      neutral: "中性"
    }
    return names[emotion as keyof typeof names] || "未知"
  }

  return (
    <div className="relative w-full">

      {/* ECharts词云主体 */}
      <div className="relative w-full bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm" style={{ height: height }}>
        {/* 功能说明 */}
        
        {/* 加载状态 */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10">
            <div className="flex flex-col items-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className="h-8 w-8 text-blue-500" />
              </motion.div>
              <p className="text-sm text-gray-600 mt-2">加载词云图表...</p>
            </div>
          </div>
        )}
        
        {/* ECharts容器 */}
        <div 
          ref={chartRef} 
          className="w-full h-full"
          style={{ width: '100%', height: '100%' }}
        />
        
      </div>
      
    </div>
  )
}
