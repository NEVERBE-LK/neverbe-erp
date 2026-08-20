import {
  Card,
  Input,
  Button,
  Row,
  Col,
  Space,
} from "antd";
import React, { useEffect, useState } from "react";
import {
  IconSitemap,
  IconLink,
  IconDeviceFloppy,
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconWand,
  IconBrandFacebook,
} from "@tabler/icons-react";
import {
  getNavigationAction,
  saveNavigationAction,
} from "@/actions/settingActions";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";
import Spinner from "@/pages/components/shared/Spinner";
import PageContainer from "../../components/container/PageContainer";

const NavigationPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [mainNavJson, setMainNavJson] = useState("[]");
  const [footerNavJson, setFooterNavJson] = useState("[]");
  const [socialLinksJson, setSocialLinksJson] = useState("[]");

  const [mainNavValid, setMainNavValid] = useState(true);
  const [footerNavValid, setFooterNavValid] = useState(true);
  const [socialLinksValid, setSocialLinksValid] = useState(true);

  const { currentUser } = useAppSelector((state) => state.authSlice);

  useEffect(() => {
    if (currentUser) {
      fetchConfig();
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      JSON.parse(mainNavJson);
      setMainNavValid(true);
    } catch {
      setMainNavValid(false);
    }
  }, [mainNavJson]);

  useEffect(() => {
    try {
      JSON.parse(footerNavJson);
      setFooterNavValid(true);
    } catch {
      setFooterNavValid(false);
    }
  }, [footerNavJson]);

  useEffect(() => {
    try {
      JSON.parse(socialLinksJson);
      setSocialLinksValid(true);
    } catch {
      setSocialLinksValid(false);
    }
  }, [socialLinksJson]);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const data = await getNavigationAction();
      setMainNavJson(JSON.stringify(data.mainNav || [], null, 2));
      setFooterNavJson(JSON.stringify(data.footerNav || [], null, 2));
      setSocialLinksJson(JSON.stringify(data.socialLinks || [], null, 2));
    } catch (e: any) {
      toast.error("Failed to load config");
    } finally {
      setLoading(false);
    }
  };

  const prettify = (type: "main" | "footer" | "social") => {
    try {
      if (type === "main") {
        const obj = JSON.parse(mainNavJson);
        setMainNavJson(JSON.stringify(obj, null, 2));
      } else if (type === "footer") {
        const obj = JSON.parse(footerNavJson);
        setFooterNavJson(JSON.stringify(obj, null, 2));
      } else {
        const obj = JSON.parse(socialLinksJson);
        setSocialLinksJson(JSON.stringify(obj, null, 2));
      }
    } catch (e) {
      toast.error("Cannot format invalid JSON");
    }
  };

  const allValid = mainNavValid && footerNavValid && socialLinksValid;

  const handleSave = async () => {
    if (!allValid) {
      toast.error("Fix invalid JSON before saving");
      return;
    }

    try {
      setSaving(true);
      const mainNav = JSON.parse(mainNavJson);
      const footerNav = JSON.parse(footerNavJson);
      const socialLinks = JSON.parse(socialLinksJson);

      await saveNavigationAction({ mainNav, footerNav, socialLinks });
      toast.success("NAVIGATION CONFIG SAVED");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Spinner size="large" tip="Loading Storefront Navigation..." />
      </div>
    );
  }

  const renderStatusPill = (isValid: boolean) =>
    isValid ? (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 font-mono">
        <IconCheck size={12} /> Valid JSON
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40 font-mono">
        <IconX size={12} /> Syntax Error
      </span>
    );

  return (
    <PageContainer title="Storefront Navigation">
      <div className="w-full space-y-6 pb-20">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-slate-900 dark:bg-slate-100 rounded-full" />
            <div>
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-sub dark:text-slate-500 leading-none mb-1 font-mono block">
                Storefront CMS
              </span>
              <h2 className="text-2xl font-bold text-text-main dark:text-text-main-dark tracking-tight leading-none">
                Navigation & Links
              </h2>
            </div>
          </div>
        </div>

        {/* Warning Alert */}
        <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 p-4 rounded-2xl flex items-start gap-3">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-xl text-amber-600 dark:text-amber-400">
            <IconAlertTriangle size={18} />
          </div>
          <div>
            <span className="font-bold text-xs text-amber-900 dark:text-amber-300 block mb-0.5">Developer Mode: JSON Navigation Schema</span>
            <p className="text-xs text-amber-700 dark:text-amber-400 m-0">
              Editing raw JSON directly updates your storefront navigation menu. Syntax checking prevents invalid saves.
            </p>
          </div>
        </div>

        <Row gutter={[20, 20]}>
          {/* Main Nav Editor */}
          <Col xs={24} lg={8}>
            <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark p-4 rounded-2xl shadow-xs flex flex-col h-full">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-card-border dark:border-card-border-dark">
                <div className="flex items-center gap-2 font-bold text-xs text-text-main dark:text-text-main-dark">
                  <IconSitemap size={16} /> Main Navigation
                </div>
                {renderStatusPill(mainNavValid)}
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-mono text-text-sub">config.main_nav.json</span>
                <button
                  type="button"
                  onClick={() => prettify("main")}
                  className="text-[10px] font-bold text-text-sub hover:text-text-main flex items-center gap-1 cursor-pointer border-none bg-transparent"
                >
                  <IconWand size={12} /> Format
                </button>
              </div>
              <Input.TextArea
                value={mainNavJson}
                onChange={(e) => setMainNavJson(e.target.value)}
                status={!mainNavValid ? "error" : ""}
                spellCheck="false"
                placeholder='[ { "title": "Home", "link": "/" } ]'
                className="font-mono text-xs flex-1 min-h-[500px] !bg-slate-900 !text-slate-200 !border-slate-800 rounded-xl p-3"
              />
            </div>
          </Col>

          {/* Footer Nav Editor */}
          <Col xs={24} lg={8}>
            <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark p-4 rounded-2xl shadow-xs flex flex-col h-full">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-card-border dark:border-card-border-dark">
                <div className="flex items-center gap-2 font-bold text-xs text-text-main dark:text-text-main-dark">
                  <IconLink size={16} /> Footer Links
                </div>
                {renderStatusPill(footerNavValid)}
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-mono text-text-sub">config.footer.json</span>
                <button
                  type="button"
                  onClick={() => prettify("footer")}
                  className="text-[10px] font-bold text-text-sub hover:text-text-main flex items-center gap-1 cursor-pointer border-none bg-transparent"
                >
                  <IconWand size={12} /> Format
                </button>
              </div>
              <Input.TextArea
                value={footerNavJson}
                onChange={(e) => setFooterNavJson(e.target.value)}
                status={!footerNavValid ? "error" : ""}
                spellCheck="false"
                placeholder='[ { "title": "About", "link": "/about" } ]'
                className="font-mono text-xs flex-1 min-h-[500px] !bg-slate-900 !text-slate-200 !border-slate-800 rounded-xl p-3"
              />
            </div>
          </Col>

          {/* Social Links Editor */}
          <Col xs={24} lg={8}>
            <div className="bg-card dark:bg-card-dark border border-card-border dark:border-card-border-dark p-4 rounded-2xl shadow-xs flex flex-col h-full">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-card-border dark:border-card-border-dark">
                <div className="flex items-center gap-2 font-bold text-xs text-text-main dark:text-text-main-dark">
                  <IconBrandFacebook size={16} /> Social Links
                </div>
                {renderStatusPill(socialLinksValid)}
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-mono text-text-sub">config.social.json</span>
                <button
                  type="button"
                  onClick={() => prettify("social")}
                  className="text-[10px] font-bold text-text-sub hover:text-text-main flex items-center gap-1 cursor-pointer border-none bg-transparent"
                >
                  <IconWand size={12} /> Format
                </button>
              </div>
              <Input.TextArea
                value={socialLinksJson}
                onChange={(e) => setSocialLinksJson(e.target.value)}
                status={!socialLinksValid ? "error" : ""}
                spellCheck="false"
                placeholder='[ { "name": "facebook", "url": "https://facebook.com/yourpage" } ]'
                className="font-mono text-xs flex-1 min-h-[500px] !bg-slate-900 !text-slate-200 !border-slate-800 rounded-xl p-3"
              />
            </div>
          </Col>
        </Row>

        {/* Floating Save Action */}
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            type="primary"
            size="large"
            danger={!allValid}
            loading={saving}
            disabled={!allValid}
            onClick={handleSave}
            icon={allValid ? <IconDeviceFloppy size={18} /> : <IconAlertTriangle size={18} />}
            className="bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 border-none h-12 px-6 rounded-2xl text-xs font-bold shadow-lg cursor-pointer flex items-center gap-2"
          >
            {!allValid ? "Fix Errors To Save" : "Save Configuration"}
          </Button>
        </div>
      </div>
    </PageContainer>
  );
};

export default NavigationPage;
