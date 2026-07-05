import { useEffect } from "react";

interface TrackingIds {
	ga4Id?: string | null;
	gtmId?: string | null;
	metaPixelId?: string | null;
}

function injectScript(id: string, html: string) {
	if (document.getElementById(id)) return;
	const container = document.createElement("div");
	container.innerHTML = html;
	const scripts = Array.from(container.querySelectorAll("script"));
	for (const s of scripts) {
		const script = document.createElement("script");
		if (s.src) script.src = s.src;
		else script.textContent = s.textContent;
		script.id = id;
		document.head.appendChild(script);
	}
}

export function useTracking({ ga4Id, gtmId, metaPixelId }: TrackingIds) {
	useEffect(() => {
		if (ga4Id) {
			injectScript(
				`ga4-${ga4Id}`,
				`<script async src="https://www.googletagmanager.com/gtag/js?id=${ga4Id}"></script>`,
			);
			injectScript(
				`ga4-init-${ga4Id}`,
				`<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga4Id}');</script>`,
			);
		}
		if (gtmId) {
			injectScript(
				`gtm-${gtmId}`,
				`<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');</script>`,
			);
		}
		if (metaPixelId) {
			injectScript(
				`meta-pixel-${metaPixelId}`,
				`<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${metaPixelId}');fbq('track','PageView');</script>`,
			);
		}
	}, [ga4Id, gtmId, metaPixelId]);
}
