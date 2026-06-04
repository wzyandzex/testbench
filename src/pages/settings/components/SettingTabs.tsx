/**
 * SettingTabs Component
 * 自定义 Tabs 导航 - 带下划线指示器动画
 */

import { memo, useCallback, useState, useEffect, useRef } from 'react';

export interface SettingTabItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
}

export interface SettingTabsProps {
  items: SettingTabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  className?: string;
}

export const SettingTabs = memo(function SettingTabs({
  items,
  activeKey,
  onChange,
  className = '',
}: SettingTabsProps) {
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabsRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  // 更新下划线指示器位置
  useEffect(() => {
    const activeTab = tabRefs.current.get(activeKey);
    if (activeTab && tabsRef.current) {
      const tabsRect = tabsRef.current.getBoundingClientRect();
      const tabRect = activeTab.getBoundingClientRect();
      setIndicatorStyle({
        left: tabRect.left - tabsRect.left,
        width: tabRect.width,
      });
    }
  }, [activeKey]);

  const handleTabClick = useCallback(
    (key: string) => {
      if (key !== activeKey) {
        onChange(key);
      }
    },
    [activeKey, onChange]
  );

  const handleTabRef = useCallback((el: HTMLButtonElement | null, key: string) => {
    if (el) {
      tabRefs.current.set(key, el);
    }
  }, []);

  return (
    <div ref={tabsRef} className={`settings-tabs ${className}`}>
      <div className="settings-tabs-list">
        {items.map((item) => (
          <button
            key={item.key}
            ref={(el) => handleTabRef(el, item.key)}
            type="button"
            className={`settings-tab ${activeKey === item.key ? 'settings-tab-active' : ''}`}
            onClick={() => handleTabClick(item.key)}
          >
            {item.icon && <span className="settings-tab-icon">{item.icon}</span>}
            <span className="settings-tab-label">{item.label}</span>
          </button>
        ))}
      </div>
      {/* 下划线指示器 */}
      <div
        className="settings-tab-indicator"
        style={{
          transform: `translateX(${indicatorStyle.left}px)`,
          width: `${indicatorStyle.width}px`,
        }}
      />
    </div>
  );
});

export default SettingTabs;
