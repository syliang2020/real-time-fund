'use client';

/**
 * 说明：
 * - 该文件保留原有导出函数名，以尽量减少对页面逻辑的改动。
 * - 但数据获取全部改为调用后端 fund 服务（SpringBoot），前端不再直连任何三方行情接口。
 */

import { isString } from 'lodash';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

import { marketApi, feedbackApi } from './backend';

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_TZ = 'Asia/Shanghai';
const getBrowserTimeZone = () => {
  if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz || DEFAULT_TZ;
  }
  return DEFAULT_TZ;
};
const TZ = getBrowserTimeZone();
dayjs.tz.setDefault(TZ);
const nowInTz = () => dayjs().tz(TZ);

// ============================
// 基金详情（估值 + 重仓）
// ============================

export const fetchFundData = async (code) => {
  if (!code) throw new Error('基金代码不能为空');
  const data = await marketApi.fundDetail(code);
  // 兼容旧逻辑：返回对象中 code/name 字段存在
  return {
    ...data,
    fundcode: data?.code || code,
  };
};

// ============================
// 基金搜索
// ============================

export const searchFunds = async (val) => {
  if (!val?.trim()) return [];
  const list = await marketApi.searchFunds(val.trim());
  // 兼容旧数据结构：前端原来使用 d.CODE/d.NAME
  return (Array.isArray(list) ? list : []).map((it) => ({
    CODE: it.code,
    NAME: it.name,
    CATEGORYDESC: it.categoryDesc,
    CATEGORY: '700',
  }));
};

// ============================
// 上证指数日期
// ============================

export const fetchShanghaiIndexDate = async () => {
  return marketApi.shanghaiIndexDate();
};

// ============================
// GitHub latest release（保留：用于版本提示，不涉及行情三方）
// ============================

export const fetchLatestRelease = async () => {
  const url = process.env.NEXT_PUBLIC_GITHUB_LATEST_RELEASE_URL;
  if (!url) return null;

  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  return {
    tagName: data.tag_name,
    body: data.body || ''
  };
};

// ============================
// 用户反馈：改为调用后端入库
// ============================

export const submitFeedback = async (formData) => {
  // 兼容原组件：formData 可能是 FormData
  let content = '';
  let contact = '';
  try {
    if (formData instanceof FormData) {
      content = String(formData.get('message') || formData.get('content') || '');
      contact = String(formData.get('email') || formData.get('contact') || '');
    } else if (formData && typeof formData === 'object') {
      content = String(formData.message || formData.content || '');
      contact = String(formData.email || formData.contact || '');
    }
  } catch {
  }
  await feedbackApi.submit({ content, contact });
  return { success: true };
};

// ============================
// OCR 文本抽取基金名称：改为本地规则抽取（不调用任何外部 LLM）
// ============================

export const extractFundNamesWithLLM = async (ocrText) => {
  if (!ocrText) return [];
  // 简单规则：匹配“基金”结尾或包含“ETF/指数/混合/股票/债券”等关键词的中文片段
  const text = String(ocrText).replace(/\s+/g, ' ');
  const candidates = new Set();

  const patterns = [
    /([\u4e00-\u9fa5A-Za-z()（）]{2,30}基金)/g,
    /([\u4e00-\u9fa5A-Za-z()（）]{2,30}(ETF|指数|混合|股票|债券|QDII))/g,
  ];
  patterns.forEach((p) => {
    let m;
    while ((m = p.exec(text)) !== null) {
      const name = (m[1] || '').trim().replaceAll(' ', '');
      if (name) candidates.add(name);
    }
  });

  return Array.from(candidates);
};

// ============================
// 基金历史净值：后端聚合
// ============================

export const fetchFundHistory = async (code, range = '1m') => {
  if (!code) return [];
  const rows = await marketApi.fundHistory(code, range);

  return (Array.isArray(rows) ? rows : [])
      .map((r) => {
        const nav = r?.nav;
        const v = typeof nav === 'number' ? nav : Number(nav);
        return {
          date: r?.date,
          value: Number.isFinite(v) ? v : null,
          nav: Number.isFinite(v) ? v : nav,
          growth: r?.growth,
        };
      })
      .filter((r) => r?.date && typeof r.value === 'number' && Number.isFinite(r.value));
};

// ============================
// 保留：智能净值（原来调用 doctorxiong）
// 现在统一走后端基金详情即可，因此这里直接复用 fetchFundData
// ============================

export const fetchSmartFundNetValue = async (code) => {
  if (!code) return null;
  const data = await fetchFundData(code);
  return {
    code: data.code || code,
    name: data.name,
    netWorth: data.dwjz,
    dayGrowth: data.zzl,
    date: data.jzrq,
    time: data.gztime,
  };
};
