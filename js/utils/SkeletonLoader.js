/**
 * SkeletonLoader - Skeleton Loading States for Better UX
 * 
 * Provides skeleton loading screens and progress indicators to improve
 * perceived performance while content is loading.
 * 
 * @author David Ferrer Figueroa
 * @version 1.0.0
 * @since 2024
 */

import { TRANSITION } from '../config/DesignTokens.js';

export class SkeletonLoader {
    static createCardSkeleton(count = 1) {
        return Array(count).fill(0).map(() => `
            <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg ${TRANSITION.SKELETON}">
                <div class="flex items-center space-x-4 mb-4">
                    <div class="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                    <div class="flex-1">
                        <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
                        <div class="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                    </div>
                </div>
                <div class="space-y-3">
                    <div class="h-3 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    <div class="h-3 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
                    <div class="h-3 bg-slate-200 dark:bg-slate-700 rounded w-4/6"></div>
                </div>
            </div>
        `).join('');
    }

    static createListSkeleton(count = 5) {
        return Array(count).fill(0).map(() => `
            <div class="flex items-center space-x-4 p-4 ${TRANSITION.SKELETON}">
                <div class="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                <div class="flex-1">
                    <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
                    <div class="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                </div>
                <div class="w-16 h-6 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
        `).join('');
    }

    static createStatsSkeleton() {
        return `
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                ${Array(4).fill(0).map(() => `
                    <div class="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-lg ${TRANSITION.SKELETON}">
                        <div class="flex items-center justify-between mb-2">
                            <div class="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                            <div class="w-12 h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
                        </div>
                        <div class="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-1"></div>
                        <div class="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    static createMapSkeleton() {
        return `
            <div class="relative bg-slate-200 dark:bg-slate-700 rounded-2xl overflow-hidden ${TRANSITION.SKELETON}" style="height: 400px;">
                <div class="absolute inset-0 flex items-center justify-center">
                    <div class="text-slate-400 dark:text-slate-500">
                        <span class="material-symbols-outlined text-4xl">map</span>
                    </div>
                </div>
                <div class="absolute top-4 left-4 right-4">
                    <div class="h-10 bg-slate-300 dark:bg-slate-600 rounded-lg"></div>
                </div>
                <div class="absolute bottom-4 left-4 right-4 space-y-2">
                    <div class="h-6 bg-slate-300 dark:bg-slate-600 rounded w-3/4"></div>
                    <div class="h-4 bg-slate-300 dark:bg-slate-600 rounded w-1/2"></div>
                </div>
            </div>
        `;
    }

    static createProgressIndicator(text = 'Cargando...') {
        return `
            <div class="flex items-center justify-center space-x-3 p-8">
                <div class="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span class="text-slate-600 dark:text-slate-400">${text}</span>
            </div>
        `;
    }

    static showSkeleton(container, type = 'card', options = {}) {
        if (!container) return;

        const { count = 3, text = 'Cargando...' } = options;
        
        let skeletonHTML = '';
        
        switch (type) {
            case 'card':
                skeletonHTML = this.createCardSkeleton(count);
                break;
            case 'list':
                skeletonHTML = this.createListSkeleton(count);
                break;
            case 'stats':
                skeletonHTML = this.createStatsSkeleton();
                break;
            case 'map':
                skeletonHTML = this.createMapSkeleton();
                break;
            case 'progress':
                skeletonHTML = this.createProgressIndicator(text);
                break;
            default:
                skeletonHTML = this.createCardSkeleton(count);
        }

        container.innerHTML = skeletonHTML;
        container.classList.add('skeleton-loading');
    }

    static hideSkeleton(container, content = '') {
        if (!container) return;
        
        container.classList.remove('skeleton-loading');
        container.innerHTML = content;
    }

    static createInlineSkeleton(width = '100%', height = '1rem') {
        return `<div class="bg-slate-200 dark:bg-slate-700 rounded ${TRANSITION.SKELETON}" style="width: ${width}; height: ${height};"></div>`;
    }

    // Utility method to wrap async operations with skeleton loading
    static async withSkeleton(container, asyncOperation, skeletonType = 'progress', options = {}) {
        this.showSkeleton(container, skeletonType, options);
        
        try {
            const result = await asyncOperation();
            return result;
        } finally {
            // Keep skeleton for minimum time to avoid flashing
            setTimeout(() => {
                container.classList.remove('skeleton-loading');
            }, Math.max(300, options.minLoadingTime || 0));
        }
    }
}

export default SkeletonLoader;
