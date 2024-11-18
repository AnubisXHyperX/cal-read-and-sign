/** @type {import('next').NextConfig} */
import { apiCompatibilityParams } from "@react-pdf-viewer/pdfjs-dist-signature";
import webpack from "webpack";

const nextConfig = {
  webpack: (config) => {
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^canvas$/,
      })
    );
    return config;
  },
};

export default nextConfig;
